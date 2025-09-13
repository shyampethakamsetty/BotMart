from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError, Page, Browser
import time
import random
import re
import os
from typing import Optional, Dict, Any, List, Tuple


class PlaywrightRunner:
    """
    Lightweight Playwright wrapper focused on demo.nopcommerce.com product interactions.
    Improvements:
      - clearer error handling and consistent return schema
      - configurable timeouts and waits
      - save screenshots to optional directory and return bytes
      - refactored duplicate code
      - safer extraction utilities
      - Simple and effective Cloudflare bypass
    """
    DEFAULT_TIMEOUT = 15000
    DEFAULT_LAUNCH_ARGS = [
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
    ]

    def __init__(self, proxy: Optional[str] = None, headless: bool = True, storage_path: Optional[str] = None, timeout_ms: int = 15000):
        self.proxy = proxy
        self.headless = headless
        self.storage_path = storage_path
        self.timeout_ms = timeout_ms

    def _launch_browser(self, p) -> Browser:
        launch_args: Dict[str, Any] = {
            "headless": self.headless,
            "args": self.DEFAULT_LAUNCH_ARGS + [
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        }
        if self.proxy:
            launch_args["proxy"] = {"server": self.proxy}
        return p.chromium.launch(**launch_args)

    def _maybe_save_bytes(self, screenshots_bytes: List[Tuple[str, bytes]], screenshot_dir: Optional[str], name: str, png_bytes: bytes):
        """Append bytes to list and optionally save to disk"""
        screenshots_bytes.append((f"{name}.png", png_bytes))
        if screenshot_dir:
            try:
                Path(screenshot_dir).mkdir(parents=True, exist_ok=True)
                with open(Path(screenshot_dir) / f"{name}.png", "wb") as fh:
                    fh.write(png_bytes)
            except Exception:
                # don't fail on screenshot saving
                pass

    def _snap(self, page: Page, name: str, screenshots_bytes: List[Tuple[str, bytes]], screenshot_dir: Optional[str] = None, full_page: bool = True):
        try:
            png = page.screenshot(full_page=full_page)
            self._maybe_save_bytes(screenshots_bytes, screenshot_dir, name, png)
        except Exception:
            # best-effort screenshot
            try:
                png = page.screenshot(full_page=False)
                self._maybe_save_bytes(screenshots_bytes, screenshot_dir, name + "-partial", png)
            except Exception:
                pass

    @staticmethod
    def _extract_numeric_price(price_str: str) -> float:
        """Extract numeric value from price string, robust to commas and currency symbols."""
        try:
            if not price_str:
                return 0.0
            cleaned = price_str.replace(',', '')
            matches = re.findall(r'\d+\.?\d*', cleaned)
            if matches:
                return float(matches[0])
            return 0.0
        except Exception:
            return 0.0

    @staticmethod
    def _extract_rating_from_style(style_str: str) -> float:
        try:
            if not style_str:
                return 0.0
            m = re.search(r'width:\s*([\d.]+)%', style_str)
            if m:
                pct = float(m.group(1))
                return round(pct / 100.0 * 5.0, 1)
            return 0.0
        except Exception:
            return 0.0

    @staticmethod
    def _apply_client_side_filters(products: List[Dict], price_min: Optional[float], price_max: Optional[float], brand: Optional[str]) -> List[Dict]:
        filtered = products
        if price_min is not None:
            filtered = [p for p in filtered if p.get("numeric_price", 0) >= price_min]
        if price_max is not None:
            filtered = [p for p in filtered if p.get("numeric_price", 0) <= price_max]
        if brand:
            bl = brand.lower()
            filtered = [p for p in filtered if bl in (p.get("title") or "").lower()]
        return filtered

    def _prepare_context(self, p):
        context_args = dict(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080},
            extra_http_headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'DNT': '1'
            }
        )
        return context_args

    def _handle_cloudflare_challenge(self, page: Page, screenshots_bytes: List[Tuple[str, bytes]], screenshot_dir: Optional[str] = None):
        """Simple and effective Cloudflare challenge handler"""
        try:
            content = page.content()
            if 'cloudflare' in content.lower() or 'checking your browser' in content.lower():
                print("Cloudflare challenge detected, waiting...")
                self._snap(page, 'cloudflare-challenge', screenshots_bytes, screenshot_dir)
                try:
                    page.wait_for_load_state('networkidle', timeout=30000)
                    page.wait_for_timeout(2500)
                    print("Cloudflare challenge completed")
                    self._snap(page, 'after-cloudflare', screenshots_bytes, screenshot_dir)
                    return True
                except PlaywrightTimeoutError:
                    print("Cloudflare challenge timeout")
                    return False
            return True
        except Exception as e:
            print(f"Error in Cloudflare handler: {e}")
            return False

    def login(self, email: str, password: str, screenshot_dir: Optional[str] = None) -> Dict[str, Any]:
        screenshots_bytes: List[Tuple[str, bytes]] = []
        with sync_playwright() as p:
            browser = self._launch_browser(p)
            context = browser.new_context(**self._prepare_context(p))
            page = context.new_page()
            try:
                page.goto('https://demo.nopcommerce.com/login', wait_until='domcontentloaded', timeout=self.timeout_ms)
                self._snap(page, 'login-page', screenshots_bytes, screenshot_dir)

                # Handle Cloudflare challenge if present
                if not self._handle_cloudflare_challenge(page, screenshots_bytes, screenshot_dir):
                    return {'status': 'error', 'message': 'Cloudflare challenge timeout', 'screenshots_bytes': screenshots_bytes}

                page.wait_for_selector('form[action="/login"] input#Email', timeout=self.timeout_ms)
                page.wait_for_selector('form[action="/login"] input#Password', timeout=self.timeout_ms)
                page.fill('form[action="/login"] input#Email', email)
                page.fill('form[action="/login"] input#Password', password)
                self._snap(page, 'filled-login', screenshots_bytes, screenshot_dir)

                # try click then enter
                clicked = False
                try:
                    page.click('form[action="/login"] button.button-1.login-button', timeout=5000)
                    clicked = True
                except Exception:
                    try:
                        page.press('form[action="/login"] input#Password', 'Enter', timeout=3000)
                        clicked = True
                    except Exception:
                        clicked = False

                end = time.time() + 25
                auth_confirmed = False
                error_message = ''
                while time.time() < end and not auth_confirmed:
                    # success indicators
                    if page.query_selector('a.ico-logout') or page.query_selector('a.ico-account'):
                        auth_confirmed = True
                        break
                    u = page.url or ''
                    if '/customer' in u or u.rstrip('/') == 'https://demo.nopcommerce.com':
                        auth_confirmed = True
                        break
                    err = page.query_selector('.message-error, .validation-summary-errors')
                    if err:
                        try:
                            error_message = (err.inner_text() or '').strip()
                        except Exception:
                            error_message = 'Login failed'
                        break
                    page.wait_for_timeout(500)

                if self.storage_path:
                    try:
                        Path(self.storage_path).parent.mkdir(parents=True, exist_ok=True)
                        context.storage_state(path=self.storage_path)
                    except Exception:
                        pass

                self._snap(page, 'after-login', screenshots_bytes, screenshot_dir)

                if error_message:
                    return {'status': 'error', 'message': error_message, 'screenshots_bytes': screenshots_bytes}
                if not auth_confirmed:
                    return {'status': 'error', 'message': 'Login confirmation not detected', 'screenshots_bytes': screenshots_bytes}

                return {'status': 'ok', 'screenshots_bytes': screenshots_bytes}
            except PlaywrightTimeoutError as e:
                return {'status': 'error', 'message': f'Login timeout: {e}', 'screenshots_bytes': screenshots_bytes}
            except Exception as e:
                return {'status': 'error', 'message': f'Login failed: {e}', 'screenshots_bytes': screenshots_bytes}
            finally:
                browser.close()

    def search(self,
               category: Optional[str] = None,
               price_min: Optional[float] = None,
               price_max: Optional[float] = None,
               brand: Optional[str] = None,
               sort_by: str = 'default',
               take_screenshot: bool = False,
               screenshot_dir: Optional[str] = None) -> Dict[str, Any]:
        screenshots_bytes: List[Tuple[str, bytes]] = []

        category_urls = {
            'computers': '/computers',
            'desktops': '/computers/desktops',
            'notebooks': '/computers/notebooks',
            'software': '/computers/software',
            'electronics': '/electronics',
            'camera-photo': '/electronics/camera-photo',
            'cell-phones': '/electronics/cell-phones',
            'apparel': '/apparel',
            'books': '/books',
            'jewelry': '/jewelry',
            'gift-cards': '/gift-cards'
        }

        with sync_playwright() as p:
            browser = self._launch_browser(p)
            context = browser.new_context(**self._prepare_context(p))
            page = context.new_page()
            try:
                base_url = 'https://demo.nopcommerce.com'
                target_url = base_url
                if category and category.lower() in category_urls:
                    target_url = base_url + category_urls[category.lower()]

                page.goto(target_url, wait_until='domcontentloaded', timeout=self.timeout_ms)
                page.wait_for_timeout(1200)
                try:
                    page.wait_for_selector('.product-item, .no-result, .no-products, .content', timeout=8000)
                except Exception:
                    pass

                self._snap(page, 'category-page', screenshots_bytes, screenshot_dir)

                # Handle Cloudflare challenge if present
                if not self._handle_cloudflare_challenge(page, screenshots_bytes, screenshot_dir):
                    return {'status': 'error', 'message': 'Cloudflare challenge timeout', 'screenshots_bytes': screenshots_bytes}

                # sorting
                if sort_by != 'default':
                    try:
                        sort_dropdown = page.query_selector('#products-orderby')
                        if sort_dropdown:
                            sort_values = {
                                'name_asc': '5',
                                'name_desc': '6',
                                'price_asc': '10',
                                'price_desc': '11',
                                'created': '15'
                            }
                            if sort_by in sort_values:
                                page.select_option('#products-orderby', value=sort_values[sort_by])
                                page.wait_for_load_state('networkidle', timeout=8000)
                                page.wait_for_timeout(1000)
                                try:
                                    page.wait_for_selector('.product-item, .no-result', timeout=4000)
                                except Exception:
                                    pass
                    except Exception:
                        pass

                # price filter (best-effort)
                if price_min is not None or price_max is not None:
                    try:
                        slider = page.query_selector('#price-range-slider')
                        if slider:
                            min_val = price_min or 0
                            max_val = price_max or 10000
                            # set via JS - best-effort for demo site
                            page.evaluate(f"""
                                try {{
                                    $('#price-range-slider').slider('values', [{min_val}, {max_val}]);
                                    if (typeof(setSelectedPriceRange) === 'function') {{
                                        setSelectedPriceRange({min_val}, {max_val});
                                    }}
                                    if (typeof(CatalogProducts) !== 'undefined' && CatalogProducts.getProducts) {{
                                        CatalogProducts.getProducts();
                                    }}
                                }} catch(e) {{ }}
                            """)
                            page.wait_for_load_state('networkidle', timeout=8000)
                            page.wait_for_timeout(1200)
                    except Exception:
                        pass

                # brand/manufacturer filter - try several selectors
                if brand:
                    try:
                        brand_selectors = [
                            f'.block-manufacturer-navigation a:has-text("{brand}")',
                            f'.manufacturer-filter input[value*="{brand}" i]',
                            f'label:has-text("{brand}") input',
                        ]
                        clicked = False
                        for sel in brand_selectors:
                            el = page.query_selector(sel)
                            if el:
                                el.click()
                                page.wait_for_load_state('networkidle', timeout=8000)
                                page.wait_for_timeout(800)
                                clicked = True
                                break
                    except Exception:
                        pass

                # ensure products loaded
                try:
                    page.wait_for_selector('.product-item, .no-result, .no-products', timeout=12000)
                except Exception:
                    try:
                        page.wait_for_load_state('networkidle', timeout=8000)
                    except Exception:
                        pass

                self._snap(page, 'search-results', screenshots_bytes, screenshot_dir)
                if take_screenshot:
                    self._snap(page, f'final-{int(time.time())}', screenshots_bytes, screenshot_dir)

                items = page.query_selector_all('.product-item')
                products: List[Dict[str, Any]] = []
                for item in items:
                    try:
                        title_el = item.query_selector('.product-title a, .product-title')
                        title = (title_el.inner_text().strip() if title_el else '') or ''
                        price_el = item.query_selector('.prices .actual-price, .prices .price-value-1, .prices')
                        price = (price_el.inner_text().strip() if price_el else '') or ''
                        old_price_el = item.query_selector('.prices .old-price, .prices .price-value-2')
                        old_price = (old_price_el.inner_text().strip() if old_price_el else '') or ''
                        img_el = item.query_selector('img')
                        image_url = img_el.get_attribute('src') if img_el else ''
                        if image_url and image_url.startswith('/'):
                            image_url = f"{base_url}{image_url}"
                        link_el = item.query_selector('.product-title a, a')
                        product_url = (link_el.get_attribute('href') if link_el else '') or ''
                        if product_url and product_url.startswith('/'):
                            product_url = f"{base_url}{product_url}"
                        rating_el = item.query_selector('.product-rating-box .rating, .rating-box .rating')
                        rating_style = rating_el.get_attribute('style') if rating_el else ''
                        rating_value = self._extract_rating_from_style(rating_style)
                        availability_el = item.query_selector('.availability, .stock')
                        availability = (availability_el.inner_text().strip() if availability_el else 'Available') or 'Available'
                        numeric_price = self._extract_numeric_price(price)

                        products.append({
                            'title': title,
                            'price': price,
                            'old_price': old_price,
                            'numeric_price': numeric_price,
                            'image_url': image_url,
                            'product_url': product_url,
                            'rating': rating_value,
                            'availability': availability
                        })
                    except Exception:
                        continue

                filtered_products = self._apply_client_side_filters(products, price_min, price_max, brand)
                first = filtered_products[0] if filtered_products else {'title': '', 'price': ''}

                # pagination info (best-effort)
                current_page = 1
                total_pages = 1
                try:
                    page_info = page.query_selector('.pager .current-page, .pager .individual-page.current')
                    if page_info:
                        cp = page_info.inner_text().strip()
                        current_page = int(cp) if cp.isdigit() else 1
                    page_links = page.query_selector_all('.pager .individual-page')
                    if page_links:
                        total_pages = len(page_links)
                except Exception:
                    pass

                return {
                    'status': 'ok',
                    'title': first.get('title', ''),
                    'price': first.get('price', ''),
                    'products': filtered_products,
                    'total_products': len(filtered_products),
                    'current_page': current_page,
                    'total_pages': total_pages,
                    'category': category,
                    'filters_applied': {
                        'category': category,
                        'price_min': price_min,
                        'price_max': price_max,
                        'brand': brand,
                        'sort_by': sort_by
                    },
                    'screenshots_bytes': screenshots_bytes
                }
            except PlaywrightTimeoutError as e:
                return {'status': 'error', 'message': f'Search timeout: {e}', 'screenshots_bytes': screenshots_bytes}
            except Exception as e:
                return {'status': 'error', 'message': f'Unexpected error: {e}', 'screenshots_bytes': screenshots_bytes}
            finally:
                browser.close()

    def add_to_cart(self, product_index: int = 0, screenshot_dir: Optional[str] = None) -> Dict[str, Any]:
        screenshots_bytes: List[Tuple[str, bytes]] = []
        with sync_playwright() as p:
            browser = self._launch_browser(p)
            context = browser.new_context(**self._prepare_context(p))
            page = context.new_page()
            try:
                page.goto('https://demo.nopcommerce.com/', wait_until='networkidle', timeout=self.timeout_ms)
                
                # Handle Cloudflare challenge if present
                if not self._handle_cloudflare_challenge(page, screenshots_bytes, screenshot_dir):
                    return {'status': 'error', 'message': 'Cloudflare challenge timeout', 'screenshots_bytes': screenshots_bytes}
                
                page.wait_for_selector('.product-item', timeout=10000)
                self._snap(page, 'home', screenshots_bytes, screenshot_dir)

                items = page.query_selector_all('.product-item')
                if not items:
                    return {'status': 'no-items', 'screenshots_bytes': screenshots_bytes}

                idx = product_index if 0 <= product_index < len(items) else 0
                target = items[idx]
                btn = target.query_selector('.product-box-add-to-cart-button')
                if btn:
                    btn.click()
                else:
                    link = target.query_selector('a')
                    if link:
                        link.click()
                        try:
                            page.wait_for_selector('button[id^="add-to-cart-button"]', timeout=5000)
                            page.click('button[id^="add-to-cart-button"]')
                        except Exception:
                            pass

                # short wait for cart update
                page.wait_for_timeout(1500)
                self._snap(page, 'after-add', screenshots_bytes, screenshot_dir)
                return {'status': 'added', 'screenshots_bytes': screenshots_bytes}
            except PlaywrightTimeoutError as e:
                return {'status': 'error', 'message': f'Add to cart timeout: {e}', 'screenshots_bytes': screenshots_bytes}
            except Exception as e:
                return {'status': 'error', 'message': f'Add to cart failed: {e}', 'screenshots_bytes': screenshots_bytes}
            finally:
                browser.close()

    def login_and_search(self, email: str, password: str, category: Optional[str] = None,
                        price_min: Optional[float] = None, price_max: Optional[float] = None,
                        brand: Optional[str] = None, sort_by: str = 'default',
                        screenshot_dir: Optional[str] = None) -> Dict[str, Any]:
        """Cascading workflow: Login first, then search"""
        screenshots_bytes: List[Tuple[str, bytes]] = []
        
        category_urls = {
            'computers': '/computers',
            'desktops': '/computers/desktops',
            'notebooks': '/computers/notebooks',
            'software': '/computers/software',
            'electronics': '/electronics',
            'camera-photo': '/electronics/camera-photo',
            'cell-phones': '/electronics/cell-phones',
            'apparel': '/apparel',
            'books': '/books',
            'jewelry': '/jewelry',
            'gift-cards': '/gift-cards'
        }

        with sync_playwright() as p:
            browser = self._launch_browser(p)
            context = browser.new_context(**self._prepare_context(p))
            page = context.new_page()
            try:
                # Step 1: Login
                page.goto('https://demo.nopcommerce.com/login', wait_until='domcontentloaded', timeout=self.timeout_ms)
                self._snap(page, 'login-page', screenshots_bytes, screenshot_dir)
                
                # Handle Cloudflare challenge if present
                if not self._handle_cloudflare_challenge(page, screenshots_bytes, screenshot_dir):
                    return {'status': 'error', 'message': 'Cloudflare challenge timeout', 'screenshots_bytes': screenshots_bytes}

                page.wait_for_selector('form[action="/login"] input#Email', timeout=self.timeout_ms)
                page.wait_for_selector('form[action="/login"] input#Password', timeout=self.timeout_ms)
                page.fill('form[action="/login"] input#Email', email)
                page.fill('form[action="/login"] input#Password', password)
                self._snap(page, 'filled-login', screenshots_bytes, screenshot_dir)

                # Login submission
                clicked = False
                try:
                    page.click('form[action="/login"] button.button-1.login-button', timeout=5000)
                    clicked = True
                except Exception:
                    try:
                        page.press('form[action="/login"] input#Password', 'Enter', timeout=3000)
                        clicked = True
                    except Exception:
                        clicked = False

                # Wait for login confirmation
                end = time.time() + 25
                auth_confirmed = False
                error_message = ''
                while time.time() < end and not auth_confirmed:
                    if page.query_selector('a.ico-logout') or page.query_selector('a.ico-account'):
                        auth_confirmed = True
                        break
                    u = page.url or ''
                    if '/customer' in u or u.rstrip('/') == 'https://demo.nopcommerce.com':
                        auth_confirmed = True
                        break
                    err = page.query_selector('.message-error, .validation-summary-errors')
                    if err:
                        try:
                            error_message = (err.inner_text() or '').strip()
                        except Exception:
                            error_message = 'Login failed'
                        break
                    page.wait_for_timeout(500)

                self._snap(page, 'after-login', screenshots_bytes, screenshot_dir)

                if error_message:
                    return {'status': 'error', 'message': error_message, 'screenshots_bytes': screenshots_bytes}
                if not auth_confirmed:
                    return {'status': 'error', 'message': 'Login confirmation not detected', 'screenshots_bytes': screenshots_bytes}

                # Step 2: Navigate to search/category page
                base_url = 'https://demo.nopcommerce.com'
                target_url = base_url
                if category and category.lower() in category_urls:
                    target_url = base_url + category_urls[category.lower()]

                page.goto(target_url, wait_until='domcontentloaded', timeout=self.timeout_ms)
                page.wait_for_timeout(1200)
                try:
                    page.wait_for_selector('.product-item, .no-result, .no-products, .content', timeout=8000)
                except Exception:
                    pass

                self._snap(page, 'category-page', screenshots_bytes, screenshot_dir)

                # Handle Cloudflare challenge if present
                if not self._handle_cloudflare_challenge(page, screenshots_bytes, screenshot_dir):
                    return {'status': 'error', 'message': 'Cloudflare challenge timeout', 'screenshots_bytes': screenshots_bytes}

                # Apply filters and sorting
                if sort_by != 'default':
                    try:
                        sort_dropdown = page.query_selector('#products-orderby')
                        if sort_dropdown:
                            sort_values = {
                                'name_asc': '5',
                                'name_desc': '6',
                                'price_asc': '10',
                                'price_desc': '11',
                                'created': '15'
                            }
                            if sort_by in sort_values:
                                page.select_option('#products-orderby', value=sort_values[sort_by])
                                page.wait_for_load_state('networkidle', timeout=8000)
                                page.wait_for_timeout(1000)
                    except Exception:
                        pass

                # Extract products
                try:
                    page.wait_for_selector('.product-item, .no-result, .no-products', timeout=12000)
                except Exception:
                    pass

                self._snap(page, 'search-results', screenshots_bytes, screenshot_dir)

                items = page.query_selector_all('.product-item')
                products: List[Dict[str, Any]] = []
                for item in items:
                    try:
                        title_el = item.query_selector('.product-title a, .product-title')
                        title = (title_el.inner_text().strip() if title_el else '') or ''
                        price_el = item.query_selector('.prices .actual-price, .prices .price-value-1, .prices')
                        price = (price_el.inner_text().strip() if price_el else '') or ''
                        numeric_price = self._extract_numeric_price(price)
                        products.append({
                            'title': title,
                            'price': price,
                            'numeric_price': numeric_price
                        })
                    except Exception:
                        continue

                filtered_products = self._apply_client_side_filters(products, price_min, price_max, brand)
                first = filtered_products[0] if filtered_products else {'title': '', 'price': ''}

                return {
                    'status': 'ok',
                    'title': first.get('title', ''),
                    'price': first.get('price', ''),
                    'products': filtered_products,
                    'total_products': len(filtered_products),
                    'category': category,
                    'screenshots_bytes': screenshots_bytes
                }
            except PlaywrightTimeoutError as e:
                return {'status': 'error', 'message': f'Workflow timeout: {e}', 'screenshots_bytes': screenshots_bytes}
            except Exception as e:
                return {'status': 'error', 'message': f'Unexpected error: {e}', 'screenshots_bytes': screenshots_bytes}
            finally:
                browser.close()

    def login_search_and_add_to_cart(self, email: str, password: str, category: Optional[str] = None,
                                   price_min: Optional[float] = None, price_max: Optional[float] = None,
                                   brand: Optional[str] = None, sort_by: str = 'default',
                                   product_index: int = 0, screenshot_dir: Optional[str] = None) -> Dict[str, Any]:
        """Cascading workflow: Login + Search + Add to Cart"""
        screenshots_bytes: List[Tuple[str, bytes]] = []
        
        category_urls = {
            'computers': '/computers',
            'desktops': '/computers/desktops',
            'notebooks': '/computers/notebooks',
            'software': '/computers/software',
            'electronics': '/electronics',
            'camera-photo': '/electronics/camera-photo',
            'cell-phones': '/electronics/cell-phones',
            'apparel': '/apparel',
            'books': '/books',
            'jewelry': '/jewelry',
            'gift-cards': '/gift-cards'
        }

        with sync_playwright() as p:
            browser = self._launch_browser(p)
            context = browser.new_context(**self._prepare_context(p))
            page = context.new_page()
            try:
                # Step 1: Login (same as login_and_search)
                page.goto('https://demo.nopcommerce.com/login', wait_until='domcontentloaded', timeout=self.timeout_ms)
                self._snap(page, 'login-page', screenshots_bytes, screenshot_dir)
                
                # Handle Cloudflare challenge if present
                if not self._handle_cloudflare_challenge(page, screenshots_bytes, screenshot_dir):
                    return {'status': 'error', 'message': 'Cloudflare challenge timeout', 'screenshots_bytes': screenshots_bytes}

                page.wait_for_selector('form[action="/login"] input#Email', timeout=self.timeout_ms)
                page.wait_for_selector('form[action="/login"] input#Password', timeout=self.timeout_ms)
                page.fill('form[action="/login"] input#Email', email)
                page.fill('form[action="/login"] input#Password', password)
                self._snap(page, 'filled-login', screenshots_bytes, screenshot_dir)

                # Login submission
                clicked = False
                try:
                    page.click('form[action="/login"] button.button-1.login-button', timeout=5000)
                    clicked = True
                except Exception:
                    try:
                        page.press('form[action="/login"] input#Password', 'Enter', timeout=3000)
                        clicked = True
                    except Exception:
                        clicked = False

                # Wait for login confirmation
                end = time.time() + 25
                auth_confirmed = False
                error_message = ''
                while time.time() < end and not auth_confirmed:
                    if page.query_selector('a.ico-logout') or page.query_selector('a.ico-account'):
                        auth_confirmed = True
                        break
                    u = page.url or ''
                    if '/customer' in u or u.rstrip('/') == 'https://demo.nopcommerce.com':
                        auth_confirmed = True
                        break
                    err = page.query_selector('.message-error, .validation-summary-errors')
                    if err:
                        try:
                            error_message = (err.inner_text() or '').strip()
                        except Exception:
                            error_message = 'Login failed'
                        break
                    page.wait_for_timeout(500)

                self._snap(page, 'after-login', screenshots_bytes, screenshot_dir)

                if error_message:
                    return {'status': 'error', 'message': error_message, 'screenshots_bytes': screenshots_bytes}
                if not auth_confirmed:
                    return {'status': 'error', 'message': 'Login confirmation not detected', 'screenshots_bytes': screenshots_bytes}

                # Step 2: Search for products
                base_url = 'https://demo.nopcommerce.com'
                target_url = base_url
                if category and category.lower() in category_urls:
                    target_url = base_url + category_urls[category.lower()]

                page.goto(target_url, wait_until='domcontentloaded', timeout=self.timeout_ms)
                page.wait_for_timeout(1200)
                try:
                    page.wait_for_selector('.product-item, .no-result, .no-products, .content', timeout=8000)
                except Exception:
                    pass

                self._snap(page, 'category-page', screenshots_bytes, screenshot_dir)

                # Handle Cloudflare challenge if present
                if not self._handle_cloudflare_challenge(page, screenshots_bytes, screenshot_dir):
                    return {'status': 'error', 'message': 'Cloudflare challenge timeout', 'screenshots_bytes': screenshots_bytes}

                # Apply filters
                if sort_by != 'default':
                    try:
                        sort_dropdown = page.query_selector('#products-orderby')
                        if sort_dropdown:
                            sort_values = {
                                'name_asc': '5',
                                'name_desc': '6',
                                'price_asc': '10',
                                'price_desc': '11',
                                'created': '15'
                            }
                            if sort_by in sort_values:
                                page.select_option('#products-orderby', value=sort_values[sort_by])
                                page.wait_for_load_state('networkidle', timeout=8000)
                                page.wait_for_timeout(1000)
                    except Exception:
                        pass

                try:
                    page.wait_for_selector('.product-item, .no-result, .no-products', timeout=12000)
                except Exception:
                    pass

                self._snap(page, 'search-results', screenshots_bytes, screenshot_dir)

                # Step 3: Add to cart
                items = page.query_selector_all('.product-item')
                if not items:
                    return {'status': 'no-items', 'screenshots_bytes': screenshots_bytes}

                idx = product_index if 0 <= product_index < len(items) else 0
                target = items[idx]
                btn = target.query_selector('.product-box-add-to-cart-button')
                if btn:
                    btn.click()
                else:
                    link = target.query_selector('a')
                    if link:
                        link.click()
                        try:
                            page.wait_for_selector('button[id^="add-to-cart-button"]', timeout=5000)
                            page.click('button[id^="add-to-cart-button"]')
                        except Exception:
                            pass

                page.wait_for_timeout(1500)
                self._snap(page, 'after-add-to-cart', screenshots_bytes, screenshot_dir)

                return {
                    'status': 'ok',
                    'message': 'Successfully completed login, search, and add to cart',
                    'screenshots_bytes': screenshots_bytes
                }
            except PlaywrightTimeoutError as e:
                return {'status': 'error', 'message': f'Workflow timeout: {e}', 'screenshots_bytes': screenshots_bytes}
            except Exception as e:
                return {'status': 'error', 'message': f'Unexpected error: {e}', 'screenshots_bytes': screenshots_bytes}
            finally:
                browser.close()

    def run_workflow(self, workflow_id: int, user_id: Optional[int] = None, params: Optional[dict] = None, screenshot_dir: Optional[str] = None):
        params = params or {}
        action = params.get('action', 'search')
        if action == 'login':
            return self.login(params.get('email', 'test@example.com'), params.get('password', 'Password1'), screenshot_dir=screenshot_dir)
        if action == 'add_to_cart':
            return self.login_search_and_add_to_cart(
                email=params.get('email', 'test@example.com'),
                password=params.get('password', 'Password1'),
                category=params.get('category'),
                price_min=params.get('price_min'),
                price_max=params.get('price_max'),
                brand=params.get('brand'),
                sort_by=params.get('sort_by', 'default'),
                product_index=params.get('product_index', 0),
                screenshot_dir=screenshot_dir
            )
        return self.login_and_search(
            email=params.get('email', 'test@example.com'),
            password=params.get('password', 'Password1'),
            category=params.get('category'),
            price_min=params.get('price_min'),
            price_max=params.get('price_max'),
            brand=params.get('brand'),
            sort_by=params.get('sort_by', 'default'),
            screenshot_dir=screenshot_dir
        )
