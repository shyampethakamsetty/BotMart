from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import time
import os

class PlaywrightRunner:
    def __init__(self, proxy: str = None, headless: bool = True, storage_path=None):
        self.proxy = proxy
        self.headless = headless
        self.storage_path = storage_path

    def _launch_browser(self, p):
        launch_args = {
            'headless': self.headless, 
            'args': [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-blink-features=AutomationControlled',
                '--disable-extensions',
                '--no-first-run',
                '--disable-default-apps',
                '--disable-infobars',
                '--disable-popup-blocking',
                '--disable-translate',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-ipc-flooding-protection',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        }
        if self.proxy:
            launch_args['proxy'] = {'server': self.proxy}
        return p.chromium.launch(**launch_args)

    def login(self, email: str, password: str):
        with sync_playwright() as p:
            browser = self._launch_browser(p)
            context = browser.new_context()
            page = context.new_page()
            
            try:
                # Navigate to login page and wait for it to load
                page.goto('https://demo.nopcommerce.com/login', wait_until='networkidle')
                
                # Wait for form elements to be visible
                page.wait_for_selector('input#Email', timeout=10000)
                page.wait_for_selector('input#Password', timeout=10000)
                
            page.fill('input#Email', email)
            page.fill('input#Password', password)
                
                # Try different submit button selectors
                submit_selectors = [
                    'button[type="submit"]',
                    'input[type="submit"]',
                    'button:has-text("Log in")',
                    '.login-button'
                ]
                
                button_clicked = False
                for selector in submit_selectors:
                    try:
                        page.wait_for_selector(selector, timeout=3000)
                        page.click(selector)
                        button_clicked = True
                        break
                    except PlaywrightTimeoutError:
                        continue
                
                if not button_clicked:
                    # If no button found, try pressing Enter
                    page.press('input#Password', 'Enter')
                
                # Wait for login to complete
                page.wait_for_load_state('networkidle')
                time.sleep(2)
                
            if self.storage_path:
                os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
                context.storage_state(path=self.storage_path)
                
                browser.close()
                return {'status': 'ok'}
                
            except PlaywrightTimeoutError as e:
                print(f"Login timeout error: {e}")
            browser.close()
                return {'status': 'error', 'message': 'Login timeout'}

    def search(self, query: str, take_screenshot=False):
        with sync_playwright() as p:
            browser = self._launch_browser(p)
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                extra_http_headers={
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
            )
            page = context.new_page()
            
            try:
                # Navigate to the page and wait for it to load
                print("Navigating to demo.nopcommerce.com...")
                page.goto('https://demo.nopcommerce.com/', wait_until='networkidle', timeout=30000)
                print("Page loaded successfully")
                
                # Check if we're on a Cloudflare challenge page
                page_content = page.content()
                if 'cloudflare' in page_content.lower() or 'checking your browser' in page_content.lower():
                    print("Detected Cloudflare challenge, waiting for it to complete...")
                    # Wait for Cloudflare challenge to complete
                    try:
                        page.wait_for_load_state('networkidle', timeout=30000)
                        # Wait a bit more for any redirects
                        page.wait_for_timeout(5000)
                    except PlaywrightTimeoutError:
                        print("Cloudflare challenge timeout")
                        browser.close()
                        return {'title': '', 'price': '', 'error': 'Cloudflare challenge timeout'}
                
                # Take a screenshot for debugging
                page.screenshot(path='/tmp/debug-page.png')
                print("Screenshot saved to /tmp/debug-page.png")
                
                # Try to find all input elements on the page
                inputs = page.query_selector_all('input')
                print(f"Found {len(inputs)} input elements on the page")
                for i, input_elem in enumerate(inputs):
                    try:
                        input_id = input_elem.get_attribute('id')
                        input_type = input_elem.get_attribute('type')
                        input_class = input_elem.get_attribute('class')
                        input_name = input_elem.get_attribute('name')
                        print(f"Input {i}: id='{input_id}', type='{input_type}', class='{input_class}', name='{input_name}'")
                    except Exception as e:
                        print(f"Error getting input {i} attributes: {e}")
                
                # Try different search input selectors
                search_input_selectors = [
                    'input[id="small-searchterms"]',
                    'input[name="q"]',
                    'input[type="search"]',
                    'input[placeholder*="search" i]',
                    'input[placeholder*="Search" i]',
                    '.search-box input',
                    '#search-box input',
                    'form[role="search"] input',
                    'input[class*="search"]',
                    'input[name="search"]',
                    'input[name="query"]'
                ]
                
                search_input_found = False
                for selector in search_input_selectors:
                    try:
                        print(f"Trying search input selector: {selector}")
                        page.wait_for_selector(selector, timeout=3000)
                        print(f"Found search input with selector: {selector}")
                        page.fill(selector, query)
                        search_input_found = True
                        break
                    except PlaywrightTimeoutError:
                        print(f"Selector {selector} not found")
                        continue
                
                if not search_input_found:
                    print("No search input found with any selector")
                    browser.close()
                    return {'title': '', 'price': '', 'error': 'Search input not found'}
                
                # Try to find and click the search button with better selectors
                search_button_selectors = [
                    'button[type="submit"]',
                    'button.search-box-button',
                    'input[type="submit"]',
                    'button:has-text("Search")',
                    '.search-box-button',
                    'form[role="search"] button',
                    'form[role="search"] input[type="submit"]',
                    'button[class*="search"]',
                    'input[value*="Search" i]'
                ]
                
                button_clicked = False
                for selector in search_button_selectors:
                    try:
                        print(f"Trying search button selector: {selector}")
                        page.wait_for_selector(selector, timeout=3000)
                        print(f"Found search button with selector: {selector}")
                        page.click(selector)
                        button_clicked = True
                        break
                    except PlaywrightTimeoutError:
                        print(f"Button selector {selector} not found")
                        continue
                
                if not button_clicked:
                    # If no button found, try pressing Enter
                    print("No search button found, trying Enter key")
                    page.press(selector, 'Enter')
                
                # Wait for search results to load
                print("Waiting for search results...")
                try:
                    page.wait_for_selector('.product-item', timeout=10000)
                    print("Found product items")
            except PlaywrightTimeoutError:
                    print("No product items found, waiting for network idle")
                    page.wait_for_load_state('networkidle')
                
            except PlaywrightTimeoutError as e:
                print(f"Timeout error during search: {e}")
                browser.close()
                return {'title': '', 'price': '', 'error': 'Search timeout'}
            except Exception as e:
                print(f"Unexpected error during search: {e}")
                browser.close()
                return {'title': '', 'price': '', 'error': f'Unexpected error: {str(e)}'}
            
            if take_screenshot:
                path = f'/tmp/search-{int(time.time())}.png'
                page.screenshot(path=path)
                print(f"Screenshot saved to {path}")
            
            # Try to find the first product item
            item = page.query_selector('.product-item')
            if item:
                try:
                    title_element = item.query_selector('.product-title')
                    title = title_element.inner_text().strip() if title_element else ''
                    
                price_el = item.query_selector('.prices') or item.query_selector('.add-info')
                price = price_el.inner_text().strip() if price_el else ''
                    print(f"Found product: {title} - {price}")
                except Exception as e:
                    print(f"Error extracting product info: {e}")
                    title = ''
                    price = ''
            else:
                print("No product items found on the page")
                title = ''
                price = ''
            
            browser.close()
            return {'title': title, 'price': price}

    def add_to_cart(self, product_index: int = 0):
        with sync_playwright() as p:
            browser = self._launch_browser(p)
            context = browser.new_context()
            page = context.new_page()
            
            try:
                page.goto('https://demo.nopcommerce.com/', wait_until='networkidle')
                
                # Wait for products to load
                page.wait_for_selector('.product-item', timeout=10000)
                
            items = page.query_selector_all('.product-item')
            if not items:
                browser.close()
                    return {'status': 'no-items'}
                
            target = items[product_index] if product_index < len(items) else items[0]
                
                # Try to find add to cart button
            btn = target.query_selector('.product-box-add-to-cart-button')
            if btn:
                btn.click()
            else:
                    # Try alternative approach
                link = target.query_selector('a')
                if link:
                    link.click()
                    page.wait_for_selector('button[id^="add-to-cart-button"]', timeout=5000)
                    page.click('button[id^="add-to-cart-button"]')
                
                time.sleep(2)
            browser.close()
                return {'status': 'added'}
                
            except PlaywrightTimeoutError as e:
                print(f"Add to cart timeout error: {e}")
                browser.close()
                return {'status': 'error', 'message': 'Add to cart timeout'}

    def run_workflow(self, workflow_id: int, user_id: int = None, params: dict = None):
        params = params or {}
        action = params.get('action', 'search')
        if action == 'login':
            return self.login(params.get('email', 'test@example.com'), params.get('password', 'Password1'))
        elif action == 'add_to_cart':
            return self.add_to_cart(params.get('product_index', 0))
        else:
            return self.search(params.get('query', 'laptop'))
