# **Food Delivery Platform \- Internship / Practicum Defense Guide**

&nbsp;

&nbsp;

Ei file-ta viva/practicum defense preparation-er jonno. Ekhane project pitch, feature logic, file map, demo sequence, ebong common question-answer deya holo. Answer korar shomoy Bangla \+ English mix kore naturally bolbe.

&nbsp;

---

&nbsp;

## **1\. One-minute project pitch**

&nbsp;

&nbsp;

**My project is a role-based Food Delivery Platform (SwiftBite-style).** Ei system-er maddhome customer restaurant browse kore cart-e add kore order place korte pare, restaurant menu/orders/reservations manage korte pare, rider order accept kore live location diye deliver korte pare, ar admin restaurants/riders/orders/payments/analytics approve ar monitor korte pare.

&nbsp;

&nbsp;

**Main objective:** Restaurant discovery theke cart, order lifecycle, payment, rider assignment, live tracking, table reservation, review ebong audit trail porjonto ekta centralized digital workflow toiri kora.

&nbsp;

&nbsp;

**Main users:**

&nbsp;

&nbsp;

| User | Main responsibility |
| :---- | :---- |
| Public visitor | Restaurant/menu dekha, review dekha, tracking code diye order track kora |
| Customer | Register/login, cart, order place/cancel/reorder, payment, address, favorite/wishlist/review, reservation |
| Restaurant owner | Apply \+ OTP setup, menu CRUD, orders accept/prepare/ready, rider assign, tables/reservations, category request |
| Rider | Apply \+ OTP setup, online/offline, order accept, status update, live location push |
| Admin | Restaurants/riders approve-suspend, orders, customers, payments, categories, reviews, analytics, settings, notifications |

&nbsp;

&nbsp;

**Technology:** Laravel 12, PHP 8.2+, Sanctum API auth, MySQL/SQLite, Eloquent ORM, migrations, middleware, local file storage, React 19 \+ Vite, Tailwind CSS 4, axios, React Router 7, Leaflet live map, framer-motion, lucide-react, SSLCommerz payment.

&nbsp;

&nbsp;

**Strong viva sentence:** `One order connects menu, cart limits, stock, payment, rider assignment and live tracking in a traceable system.`

&nbsp;

---

&nbsp;

## **2\. Problem statement and objectives**

&nbsp;

&nbsp;

### **Existing problem**

&nbsp;

&nbsp;

Phone-e order nile menu update, stock control, kitchen overload, rider chaos, payment tracking ar review moderation — sob manual thake. Unlimited cart hole fake/bulk order-e kitchen block hoy, rider waste hoy, COD loss hoy.

&nbsp;

&nbsp;

### **My solution**

&nbsp;

&nbsp;

&nbsp;

* Public restaurant/menu browse \+ search/filter.

&nbsp;

* Single-restaurant cart with per-item / stock / daily-cap guardrails.

&nbsp;

* Strict order status machine with restaurant \+ rider transitions.

&nbsp;

* Rider assignment only when ready, one active delivery per rider.

&nbsp;

* Cash \+ SSLCommerz (bKash/Nagad/card) payment with verify callback.

&nbsp;

* Live tracking with tracking code (public \+ customer) and Leaflet route map.

&nbsp;

* Table reservation \+ restaurant tables, dine-in/takeout/delivery order types.

&nbsp;

* Review moderation (pending \-\> approved/rejected \+ featured), favorites, wishlist, addresses.

&nbsp;

* AI chat widget, activity log, admin notifications, analytics.

&nbsp;

&nbsp;

&nbsp;

### **Objective**

&nbsp;

&nbsp;

`The objective is not only to show restaurants; it is to run the complete order lifecycle with role-based access, inventory limits and auditable data.`

&nbsp;

---

&nbsp;

## **3\. High-level workflow**

&nbsp;

&nbsp;

Public website

&nbsp;&nbsp;&nbsp;&nbsp;\-\> Customer register/login

&nbsp;&nbsp;&nbsp;&nbsp;\-\> Restaurant browse \-\> menu \-\> cart add

&nbsp;&nbsp;&nbsp;&nbsp;\-\> Checkout (address \+ order_type \+ payment_method)

&nbsp;&nbsp;&nbsp;&nbsp;\-\> `POST /customer/orders` \-\> pending order create

&nbsp;&nbsp;&nbsp;&nbsp;\-\> Cash hole direct tracking, online hole SSLCommerz gateway

&nbsp;&nbsp;&nbsp;&nbsp;\-\> Restaurant confirmed \-\> preparing \-\> ready

&nbsp;&nbsp;&nbsp;&nbsp;\-\> Rider assign (ready \+ delivery only) \-\> picked_up \-\> on_the_way \-\> near_customer \-\> delivered/served

&nbsp;&nbsp;&nbsp;&nbsp;\-\> Customer review/favorite/wishlist

&nbsp;&nbsp;&nbsp;&nbsp;\-\> Admin analytics \+ audit trail

&nbsp;

&nbsp;

&nbsp;

&nbsp;

Viva-te bolbe: `Each major step changes a business status and creates a traceable record (OrderStatusHistory + ActivityLog), so the workflow is measurable instead of being only a form submission.`

&nbsp;

---

&nbsp;

## **4\. Complete project file structure**

&nbsp;

&nbsp;

Defense-e ei tree-ta explain korbe. Sob file memorise korar dorkar nei; kon folder-er responsibility ki, eta clear thaka important.

&nbsp;

&nbsp;

food_delivery/

|

|-- backend/                                   \# Laravel 12 API

|   |-- app/

|   |   |-- Http/

|   |   |   |-- Controllers/

|   |   |   |   |-- AuthController.php                 \# register/login/apply/OTP/password

|   |   |   |   |-- CustomerController.php             \# cart checkout placeOrder/reorder, profile, favorites, wishlist, addresses, reviews

|   |   |   |   |-- RestaurantController.php           \# menu CRUD, orders, rider assign, tables, reservations, public list/show

|   |   |   |   |-- RiderController.php                \# availability, location, accept, status update

|   |   |   |   |-- AdminController.php                \# approve/suspend, orders, payments, analytics, settings, categories, reviews

|   |   |   |   |-- SslCommerzController.php           \# initiate + success/fail/cancel/ipn verify

|   |   |   |   |-- TrackingController.php             \# track by code + route

|   |   |   |   |-- ReservationController.php          \# dine-in reservation + table assign

|   |   |   |   |-- ChatController.php                 \# AI chat (throttled)

|   |   |   |   \`-- Controller.php                      \# Base controller

|   |   |   |-- Middleware/

|   |   |   |   |-- CheckRole.php                      \# role:customer/restaurant/rider/admin guard

|   |   |   \`-- Concerns/SendsSetupOtp.php         \# owner/rider OTP mail

|   |   |

|   |   |-- Models/                                    \# Eloquent database models

|   |   |   |-- User.php, Restaurant.php, Rider.php

|   |   |   |-- MenuItem.php, Order.php, OrderItem.php

|   |   |   |-- OrderStatusHistory.php, RiderLocation.php

|   |   |   |-- Reservation.php, RestaurantTable.php

|   |   |   |-- Review.php, Favorite.php, WishlistItem.php

|   |   |   |-- CustomerAddress.php, Category.php, CategoryRequest.php

|   |   |   |-- Setting.php, AdminNotification.php, ActivityLog.php

|   |   |

|   |   |-- Support/

|   |   |   |-- OrderLimits.php                    \# effectiveMaxPerItem + needsReview logic

|   |   |   |-- OrderStatuses.php                  \# status lists + allowed transitions

|   |   |   |-- Geocoder.php                       \# restaurant/customer lat-lng

|   |   |   |-- RouteCalculator.php, Tunnel.php

|   |   |

|   |   \`-- Providers/

|   |

|   |-- config/

|   |   |-- order.php                            \# default 10/item, 20 distinct, 50 units, hard 100/200, 5 active, review 20/10k

|   |   |-- app.php, auth.php, database.php, sslcommerz.php, sanctum.php ...

|   |

|   |-- database/

|   |   |-- migrations/                                 \# Versioned schema

|   |   |   |-- *_create_restaurants_table.php

|   |   |   |-- *_create_menu_items_table.php

|   |   |   |-- *_create_orders_table.php + *_create_order_items_table.php

|   |   |   |-- *_add_inventory_limits_to_menu_items_and_restaurants.php   \# stock_quantity, daily_cap, max_per_order, default_max_per_item, allow_bulk_orders

|   |   |   |-- *_add_review_flags_to_orders_table.php                    \# needs_review, review_reason

|   |   |   |-- *_create_restaurant_tables_table.php + reservations

|   |   |   |-- *_create_reviews_table.php + moderation

|   |   |   \`-- ...

|   |   |-- seeders/  \# RestaurantSeeder, HomepageReviewsSeeder ...

|   |   \`-- backup_swiftbite_2026-08-30.sql

|   |

|   |-- routes/

|   |   |-- api.php                                      \# All API routes (public + role groups)

|   |   |-- web.php, console.php

|   |

|   |-- artisan, composer.json, phpunit.xml

|

|-- frontend/                                  \# React 19 + Vite

|   |-- src/

|   |   |-- app/App.jsx, main.jsx, routes/Routers.jsx

|   |   |-- features/api/apiSlice.js               \# axios + customerApi/restaurantApi/riderApi/adminApi

|   |   |-- features/auth/AuthContext.jsx

|   |   |-- context/CartContext.jsx                \# single-restaurant cart + clampToLimits

|   |   |-- utils/orderLimits.js                   \# getEffectiveCap, isSoldOut, formatLimitError

|   |   |-- utils/foodImages.js, prefetch.js, polyline.js, reservationConfig.js

|   |   |-- components/NavBar.jsx, CartDrawer.jsx, DishDetailModal.jsx, FoodCard.jsx, LiveMap.jsx, ChatWidget.jsx ...

|   |   |-- pages/Home/ (Hero, TrendingDishes, PopularCategories ...)

|   |   |-- pages/Restaurants/, pages/RestaurantMenu/

|   |   |-- pages/Checkout/, pages/OrderTracking/, pages/PublicTracking/

|   |   |-- pages/CustomerDashboard/

|   |   |-- pages/RestaurantDashboard/ (OrdersManagement, MenuManagement, Settings, Reservations, TableManagement, Analytics ...)

|   |   |-- pages/RiderDashboard/, pages/AdminDashboard/sections/ ...

|   |   |-- pages/Login/, Register/, SignupRestaurant/, SignupRider/, RestaurantSetup/, RiderSetup/

|   |   |-- pages/Payment/ (PaymentSuccess, PaymentFailed)

|   |

|   |-- vite.config.js, eslint.config.js, package.json

|

\`-- Defense.md                                        \# This viva preparation guide

&nbsp;

&nbsp;

&nbsp;

### **Folder-by-folder viva answer**

&nbsp;

&nbsp;

**Q: `app/Http/Controllers`\-e ki thake?**
`HTTP request receive, validation trigger, model/support call and JSON response. Controller-e unnecessary business rule rakhi na — limit/status logic Support class-e.`

&nbsp;

&nbsp;

**Q: `app/Models`\-e ki thake?**
`Table-er Eloquent representation, fillable, casts (price decimal, is_available boolean, stock integer), appends (image_url, effective_price), relationships (restaurant->menuItems/orders, order->items/rider, user->orders/restaurant/rider).`

&nbsp;

&nbsp;

**Q: `app/Support`\-e ki thake?**
`Reusable domain rules. OrderLimits-e effectiveMax + needsReview, OrderStatuses-e status machine, Geocoder-e lat-lng.`

&nbsp;

&nbsp;

**Q: `config/order.php` keno?**
`Cart/inventory guardrail single source of truth. ENV diye default/hard/active/review threshold change kora jay without code change.`

&nbsp;

&nbsp;

**Q: `routes/api.php`\-e sob route keno?**
`This is an SPA + API project. Public routes open, bhitore auth:sanctum group, tar bhitore role:customer/restaurant/rider/admin prefix groups. Frontend axios diye consume kore.`

&nbsp;

&nbsp;

**Q: `frontend/src/context` vs `utils`?**
`CartContext-e cart state + reducer + localStorage persist. orderLimits.js-e pure cap calculation so CartDrawer/Checkout/DishDetailModal same rule reuse korte pare.`

&nbsp;

&nbsp;

---

&nbsp;

## **4.1 How a request travels (API + SPA)**

&nbsp;

&nbsp;

Browser (React)

&nbsp;&nbsp;\-\> axios `/api/...` with `Bearer token_role`

&nbsp;&nbsp;\-\> routes/api.php

&nbsp;&nbsp;\-\> auth:sanctum \+ role middleware (CheckRole)

&nbsp;&nbsp;\-\> Controller \-\> validate \-\> Support/Model \-\> DB

&nbsp;&nbsp;\-\> JSON response \-\> React state update \-\> UI

&nbsp;

&nbsp;

&nbsp;

&nbsp;

**Important answer:** Controller request receive kore and response dey. Support reusable rule rakhe. Model relation manage kore. Middleware auth + role check kore. React UI render kore, backend final authority.

&nbsp;

---

&nbsp;

## **5\. Roles and access control**

&nbsp;

&nbsp;

`users.role` field \+ `CheckRole` middleware \+ Sanctum token per role (`token_customer`, `token_restaurant` ...) diye access control.

&nbsp;

&nbsp;

| Role | Allowed area |
| :---- | :---- |
| `customer` | `/customer/*` — orders, payment initiate, reservations, reviews, favorites, wishlist, addresses |
| `restaurant` | `/restaurant/*` — menu-items, orders/status, assign-rider, tables, reservations, category-requests |
| `rider` | `/rider/*` — availability, location, accept, status update |
| `admin` | `/admin/*` — approve/suspend restaurants-riders-customers, orders, payments, analytics, settings, categories, reviews |

&nbsp;

&nbsp;

**Security answer:** Token na thakle 401 \-\> login redirect. Role mismatch hole 403. Customer sudhu nijer order (`$request->user()->orders()->findOrFail`), restaurant sudhu nijer `restaurant_id` scope, rider sudhu assigned order update korte pare.

&nbsp;

---

&nbsp;

## **6\. Core feature logic: cart + placeOrder + inventory limits**

&nbsp;

&nbsp;

### **User flow**

&nbsp;

&nbsp;

&nbsp;

1. Customer restaurant page open kore, `GET /restaurants/{id}` theke menu + `max_per_order/stock_quantity/daily_cap` pay.

&nbsp;

2. Dish modal-e qty select kore Add to Cart — frontend `getEffectiveCap()` diye cap kore, `+` button max-e disable.

&nbsp;

3. CartDrawer/Checkout open korle `POST /restaurant/menu-items/check-availability` diye stale/sold-out item remove ba quantity clamp hoy.

&nbsp;

4. `POST /customer/orders` with `{restaurant_id, items:[{menu_item_id, quantity}], order_type, payment_method, delivery_address}`.

&nbsp;

5. Server validate kore transaction-e stock decrement kore `pending` order + `OrderItem` lines + `ActivityLog` create kore.

&nbsp;

6. Cash hole direct tracking page, online hole `/customer/payment/initiate` \-\> SSLCommerz gateway \-\> success/fail/ipn.

&nbsp;

&nbsp;

&nbsp;

**Viva answer:** `Price client theke trust kori na — effective_price server-e recalculate hoy. Quantity client + server duijaygay cap hoy, but final authority backend validation + DB lock.`

&nbsp;

&nbsp;

**Relevant files:**

&nbsp;

&nbsp;

&nbsp;

* `routes/api.php` — `POST /customer/orders`, `POST /restaurant/menu-items/check-availability`

&nbsp;

* `app/Http/Controllers/CustomerController.php` — `placeOrder()`, `buildOrderLines()`, `reorder()`

&nbsp;

* `app/Support/OrderLimits.php`, `config/order.php`

&nbsp;

* `app/Models/MenuItem.php` — `isSoldOut()`, `Restaurant.php`, `Order.php`

&nbsp;

* `frontend/src/context/CartContext.jsx`, `utils/orderLimits.js`

&nbsp;

* `frontend/src/components/DishDetailModal.jsx`, `CartDrawer.jsx`, `pages/Checkout/Checkout.jsx`

&nbsp;

---

&nbsp;

### **6.1 Limit function — how it works + example**

&nbsp;

&nbsp;

**Rule chain (backend `OrderLimits::effectiveMaxPerItem`, frontend `getEffectiveCap` same):**

&nbsp;

`effectiveMax = item.max_per_order → restaurant.default_max_per_item → platform default 10`, always `min(..., hard 100)`. Stock/daily further clamp kore.

&nbsp;

Platform defaults (`config/order.php`): `10/item, 20 distinct, 50 units/order, hard 100/item + 200/order, max 5 active orders, review at 20 units / ৳10k`.

&nbsp;

Restaurant manage korte pare: `Settings → default_max_per_item + allow_bulk_orders`, `Menu → stock_quantity (blank=unlimited, 0=sold out) + daily_cap + max_per_order`.

&nbsp;

**Example:**

&nbsp;

Setup: Restaurant `default_max_per_item=5, allow_bulk_orders=false`. Burger: `stock=30, daily_cap=50, max_per_order=null → effective 5`. Fries: `stock=null, max_per_order=2 → effective 2`.

&nbsp;

1. Customer 3x Burger add kore — `min(3,5)=3` cart-e jay. `+` 5-e stop.

&nbsp;

2. Checkout-e server bole stock 30 ache, daily remaining 50 — clamp lage na.

&nbsp;

3. `placeOrder` transaction-e: row `lockForUpdate`, same-restaurant check, `is_available + !isSoldOut`, `qty<=effectiveMax`, `qty<=stock`, `daily sold today + qty <= daily_cap` — sob pass hole `stock 30→27 decrement`, subtotal `effective_price*qty`, `needs_review = 5>=20? no`.

&nbsp;

4. Jodi 8x Burger pathay → `422 "Chicken Burger allows max 5 per order"`. 60 units pathale → `422 "allows up to 50 units ... contact for catering"`. `allow_bulk` on thakle 60 pass kintu `needs_review=true + review_reason` niye save hoy, restaurant `OrdersManagement`-e amber badge dekhe confirm kore.

&nbsp;

&nbsp;

**Viva line:** `Frontend cap is UX, backend cap is security. Duplicate lines reject kori jate 10+10 bypass na hoy, ar stock decrement transaction+lock-e hoy jate race-e negative stock na hoy.`

&nbsp;

---

&nbsp;

## **7\. Order status machine + rider assignment**

&nbsp;

&nbsp;

`OrderStatuses::ORDER_STATUSES = pending, confirmed, preparing, ready, assigned, picked_up, on_the_way, near_customer, delivered, served, cancelled`.

&nbsp;

Restaurant transitions: `pending→confirmed→preparing→ready (+cancel)`, `ready→served` (dine_in) / `delivered` (takeout). Rider: `assigned→picked_up→on_the_way→near_customer→delivered/served`. `canTransition()` diye illegal jump block.

&nbsp;

Rider assign rule: `status must be ready + order_type != takeout + rider approved & online + rider has no ACTIVE order`. Admin-o same check kore. Eta diye double-booking prevent hoy.

&nbsp;

&nbsp;

**Relevant:** `Support/OrderStatuses.php`, `RestaurantController@updateOrderStatus/assignRider`, `RiderController@acceptOrder/updateStatus`, `OrderStatusHistory` model, `OwnerDashboard/OrdersManagement/RiderDashboard` pages.

&nbsp;

---

&nbsp;

## **8\. Payment (SSLCommerz) + tracking**

&nbsp;

&nbsp;

Checkout-e `payment_method: cash/bkash/nagad/card`. Cash hole order direct `pending`. Online hole `POST /customer/payment/initiate {order_id, amount}` — amount vs `order.total` ±0.01 match na hole reject. Gateway URL-e redirect, pore `/payment/success|fail|cancel|ipn` callback `validateAndMarkPaid` kore `payment_status paid` + order load.

&nbsp;

Tracking: `SB-YYYY-00001` code order create-e auto. `GET /track/{code}` public, `GET /track/{code}/route` Leaflet polyline. Customer `OrderTracking.jsx` rider location + restaurant/customer coords (Geocoder) show kore.

&nbsp;

&nbsp;

**Payment answer:** `Form submit korlei paid dhori na. Gateway verify + amount match + admin payments list diye auditable rakhi.`

&nbsp;

&nbsp;

**Relevant files:** `SslCommerzController.php`, `TrackingController.php`, `Support/Geocoder.php + RouteCalculator.php`, `pages/Checkout + PaymentSuccess/Failed + OrderTracking + PublicTracking`, `components/LiveMap.jsx`.

&nbsp;

---

&nbsp;

## **9\. Restaurant portal: menu, tables, reservations**

&nbsp;

&nbsp;

Restaurant apply → admin approve → OTP verify → password set → login. Tarpor profile (cover/logo/delivery_fee/accepts_dine_in/default_max_per_item/allow_bulk), menu CRUD with image upload/URL + `is_available` toggle, `stock/daily/max` fields, tables CRUD + `available/disabled`, reservations confirm/cancel + table assign, category request → admin approve.

&nbsp;

Public menu sudhu `is_available=true` items return kore (`publicList/publicShow`), sathe `max_per_order/is_sold_out` so frontend agei cap dekhate pare.

&nbsp;

&nbsp;

**Relevant:** `RestaurantController@createMenuItem/updateMenuItem/toggleAvailability/checkAvailability/tables/*`, `ReservationController@store/restaurantIndex/updateStatus/assignTable`, `MenuManagement.jsx, Settings.jsx, Reservations.jsx, TableManagement.jsx, EditProfile.jsx`.

&nbsp;

---

&nbsp;

## **10\. Reviews, favorites, wishlist, addresses, chat**

&nbsp;

&nbsp;

Customer `POST /customer/reviews` → `pending` → admin approve/reject/feature. Featured + approved sudhu public (`featuredReviews`, `publicReviews`, `menuItemReviews`). Favorite = restaurant-level, wishlist = dish-level. Addresses with `is_default`. Chat `POST /chat` throttled `30/min`.

&nbsp;

&nbsp;

**Privacy answer:** `Customer sudhu nijer favorite/wishlist/address CRUD korte pare (user_id scope). Review pending thakle public-e show hoy na.`

&nbsp;

&nbsp;

**Relevant:** `CustomerController@storeReview/favorites*/wishlistItems*/addresses*`, `AdminController@reviews*/setReviewFeatured`, `ChatController@send`, `CustomerDashboard.jsx`.

&nbsp;

---

&nbsp;

## **11\. Admin portal**

&nbsp;

&nbsp;

| Module | Purpose |
| :---- | :---- |
| Overview/Stats/Analytics | Orders/day, revenue, status breakdown, top restaurants/riders, returning customers |
| Restaurants/Riders | Pending list → approve/reject, suspend/activate, detail + current assigned order |
| Orders | Filter + rider assign (terminal/takeout guard), detail with items/rider/history |
| Customers/Payments | Order count, suspend, payment list |
| Categories | CRUD + reorder + restaurant category-requests approve |
| Reviews | Approve/reject/feature/delete |
| Settings/Notifications | Platform settings, AdminNotification read |

&nbsp;

&nbsp;

**Admin answer:** `Admin order lifecycle read-only mostly — rider assign + analytics + moderation-e focused, kitchen flow restaurant/rider-er haate.`

&nbsp;

---

&nbsp;

## **12\. Database and relationships**

&nbsp;

&nbsp;

Important tables/models:

&nbsp;

&nbsp;

User

&nbsp;&nbsp;\-\> Restaurant \-\> MenuItem \-\> OrderItem

&nbsp;&nbsp;\-\> Rider \-\> RiderLocation

&nbsp;&nbsp;\-\> Order \-\> OrderItem + OrderStatusHistory

&nbsp;&nbsp;\-\> Favorite / WishlistItem / CustomerAddress / Review

&nbsp;

Restaurant

&nbsp;&nbsp;\-\> menuItems / orders / reviews / reservations / tables

&nbsp;

Reservation \-\> RestaurantTable, CategoryRequest \-\> Category

&nbsp;

Setting / AdminNotification / ActivityLog (audit)

&nbsp;

&nbsp;

&nbsp;

Database schema migrations-e maintain kora hoy. Cart table nei — cart frontend `localStorage (swiftbite_cart)` + server `checkAvailability` diye validate hoy. Price `decimal:2`, qty `integer`, status `string` + Support constants diye guard.

&nbsp;

&nbsp;

&nbsp;

**Why migrations?** `Migrations make the database structure reproducible, version-controlled and easier to deploy than manually editing tables. Inventory limits er moto pore feature add holeo purono data break hoy na (nullable columns).`

&nbsp;

&nbsp;

---

&nbsp;

## **13\. Validation and security**

&nbsp;

&nbsp;

&nbsp;

* `placeOrder` validation: `restaurant exists, items array 1..20, menu_item exists, qty 1..100`, duplicate-line reject, cross-restaurant reject.

&nbsp;

* Price recalc server-e, image/file MIME + size check, phone/address max length.

&nbsp;

* Sanctum Bearer per role + `role:*` middleware; 401 → login redirect (`apiSlice.js` interceptor).

&nbsp;

* OTP routes throttled (`5,1` / `3,1`), chat `30,1`.

&nbsp;

* Ownership scope: customer `->orders()->findOrFail`, restaurant `where restaurant_id = own`, rider assigned-only.

&nbsp;

* Stock safety: `DB::transaction + lockForUpdate + decrement only after all lines pass`.

&nbsp;

&nbsp;

&nbsp;

**If asked about improvement:** `Rate limit on placeOrder, payment signature verify harden, image virus scan, policy classes, real-time websocket instead of polling for rider location.`

&nbsp;

&nbsp;

---

&nbsp;

## **14\. Common viva questions and ready answers**

&nbsp;

&nbsp;

&nbsp;

**Q: Project-er main contribution ki?**
`Role-based food delivery lifecycle: capped cart, guarded checkout, status machine, rider assignment, payment verify and live tracking in one platform.`

&nbsp;

&nbsp;

**Q: Why Laravel + React?**
`Laravel gives routing, middleware, Sanctum auth, ORM, migrations, validation in one framework. React+Vite gives fast SPA cart/checkout/tracking UX. API separation keeps mobile-app scope open.`

&nbsp;

&nbsp;

**Q: MVC ki? Ekhane kivabe?**
`Model data+relation, View React UI, Controller request coordinate. Heavy reusable rule Support-e (OrderLimits/OrderStatuses).`

&nbsp;

&nbsp;

**Q: Unlimited cart viable? Limit ache? Restaurant manage korte pare?**
`Na, unlimited viable na — age chilo, ekhon capped. Default 10/item, 20 distinct, 50 units, hard 100/200, 5 active. Restaurant Settings-e default_max + bulk toggle, Menu-te stock/daily/max set korte pare. Blank = unlimited/made-to-order. Example: max 5 thakle 8 pathale 422.`

&nbsp;

&nbsp;

**Q: Stock race hole negative hobe na keno?**
`buildOrderLines transaction-e lockForUpdate niye check kore, sob line pass korle tarpor decrement. Concurrent request serial hoy, tai oversell hoy na.`

&nbsp;

&nbsp;

**Q: Customer onno customer-er order dekhte pare?**
`Na. orderShow/orders sob $request->user()->orders() scope-e.`

&nbsp;

&nbsp;

**Q: Rider double delivery nite pare?**
`Na. availableRiders + assignRider + acceptOrder — tin jaygay ACTIVE_STATUSES check. Ekta active thakle second assign/accecpt block.`

&nbsp;

&nbsp;

**Q: Takeout-e rider assign hoy na keno?**
`Takeout self-pickup, tai ready→delivered direct restaurant kore. assignRider-e order_type takeout hole ValidationException.`

&nbsp;

&nbsp;

**Q: Payment success na hoyeo paid dekhabe?**
`Na. initiate-amount match + gateway callback validateAndMarkPaid na hole pending-e thake.`

&nbsp;

&nbsp;

**Q: Future improvement ki?**
`Websocket live location, coupon/promo, catering bulk flow, push/SMS notify,peregrine delivery fee by distance, mobile app.`

&nbsp;

&nbsp;

---

&nbsp;

## **15\. Five-minute live demo sequence**

&nbsp;

&nbsp;

&nbsp;

&nbsp;

1. Home + Restaurants page — search/filter show koro.

&nbsp;

2. RestaurantMenu open kore dish modal qty cap + sold-out badge explain koro.

&nbsp;

3. Add to cart → CartDrawer clamp notice → Checkout availability check dekhao.

&nbsp;

4. Cash-e order place kore tracking code + OrderTracking map dekhao.

&nbsp;

5. Restaurant login kore OrdersManagement-e Needs review + Accept→Preparing→Ready flow dekhao.

&nbsp;

6. Rider assign (delivery only) → RiderDashboard accept → picked_up → live location.

&nbsp;

7. Customer review + favorite/wishlist + reorder (capped) dekhao.

&nbsp;

8. Admin login kore approve/analytics/activity-log dekhao.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

**Demo narration:** `I am showing one connected scenario: a capped cart becomes a guarded order, the kitchen confirms it, a rider delivers it with live tracking, and admin sees the audit trail.`

&nbsp;

&nbsp;

---

&nbsp;

## **16\. File touch-map for viva**

&nbsp;

&nbsp;

&nbsp;

| If they ask about... | Open these files |
| :---- | :---- |
| Public website | `routes/api.php`, `RestaurantController@publicList/publicShow`, `pages/Home + Restaurants` |
| Cart + limits | `config/order.php`, `Support/OrderLimits.php`, `context/CartContext.jsx`, `utils/orderLimits.js` |
| Checkout order | `CustomerController@placeOrder/buildOrderLines`, `pages/Checkout/Checkout.jsx` |
| Status machine | `Support/OrderStatuses.php`, `RestaurantController@updateOrderStatus`, `RiderController@updateStatus` |
| Rider assign | `RestaurantController@assignRider/availableRiders`, `RiderController@acceptOrder`, `RiderDashboard.jsx` |
| Payment | `SslCommerzController.php`, `pages/Checkout + PaymentSuccess/Failed` |
| Tracking | `TrackingController.php`, `Support/Geocoder + RouteCalculator`, `OrderTracking + LiveMap` |
| Restaurant menu | `RestaurantController@createMenuItem/updateMenuItem/checkAvailability`, `MenuManagement.jsx` |
| Tables/reservations | `ReservationController.php`, `RestaurantController@tables/*`, `Reservations.jsx + TableManagement.jsx` |
| Reviews/fav/wishlist | `CustomerController@storeReview/favorites/wishlist`, `AdminController@reviews*` |
| Roles/security | `Middleware/CheckRole.php`, `User.php isCustomer/isRestaurant...`, `features/api/apiSlice.js` |
| Admin/analytics | `AdminController@overview/stats/analytics/activityLog`, `AdminDashboard/sections/*` |
| Database | `database/migrations/`, related models in `app/Models/` |

&nbsp;

&nbsp;

---

&nbsp;

## **17\. Final Bangla-English cheat sheet**

&nbsp;

&nbsp;

&nbsp;

&nbsp;

* **Project ta ki?** Role-based food delivery: customer, restaurant, rider, admin.

&nbsp;

* **Main flow ki?** Browse \-\> capped cart \-\> guarded checkout \-\> pending \-\> confirmed \-\> preparing \-\> ready \-\> rider assign \-\> delivered \-\> review.

&nbsp;

* **Limit kivabe?** Item→store→platform default 10, hard 100/200, stock decrement transaction-e, bulk needs_review.

&nbsp;

* **Logic koi?** Controllers coordinate; Models relation; Support reusable rule; React UI.

&nbsp;

* **Security kivabe?** Sanctum + role middleware + ownership scope + server validation + throttle.

&nbsp;

* **Customer benefit ki?** One-cart checkout, tracking code + live map, reorder, addresses, wishlist.

&nbsp;

* **Restaurant benefit ki?** Menu + stock/daily/max control, order flow, rider assign, tables/reservations.

&nbsp;

* **Rider benefit ki?** One active delivery, accept + status + location push.

&nbsp;

* **Admin benefit ki?** Approve/suspend, payments, analytics, moderation, audit.

&nbsp;

* **Best closing line:** `This project reduces manual phone orders and creates a capped, traceable and role-based food delivery workflow.`

&nbsp;

&nbsp;

&nbsp;

---

&nbsp;

## **18\. Detailed implementation questions**

&nbsp;

&nbsp;

&nbsp;

**Q: New feature add korte hole ki ki korben?**
`First migration, then model fillable/casts/relation, Support rule if reusable, controller validation, api route + role middleware, React apiSlice + page, finally manual + build test.`

&nbsp;

&nbsp;

**Q: CRUD kivabe implement korechen?**
`Menu CRUD: validate → Eloquent create/update → JSON. Read-e restaurant_id scope + orderBy. Delete-er age own record findOrFail + storage image delete.`

&nbsp;

&nbsp;

**Q: Validation controller-e keno?**
`Invalid/unsafe value DB-te jawar age request level-e stop kore. UI cap UX improve kore, but server validation final authority.`

&nbsp;

&nbsp;

**Q: Eloquent relationship-er benefit ki?**
`Order->items/rider/user/restaurant/statusHistories direct load kora jay, N+1 komate with() use kori. Code readable thake.`

&nbsp;

&nbsp;

---

&nbsp;

## **19\. Important business rules and data safety**

&nbsp;

&nbsp;

&nbsp;

### **Stock transaction**

&nbsp;

&nbsp;

`buildOrderLines` transaction-e `lockForUpdate` niye sob line validate kore, tarpor `decrement(stock_quantity)`. Fail hole full rollback, tai half-order hoy na. Daily cap `whereDate(today)+status!=cancelled sum(qty)` diye check hoy.

&nbsp;

&nbsp;

&nbsp;

**Viva line:** `Inventory is not just a number update; check + decrement happen atomically under a lock, so concurrent orders cannot drive stock negative.`

&nbsp;

&nbsp;

&nbsp;

### **Bulk / needs_review**

&nbsp;

&nbsp;

`>=20 units or >=৳10k` hole order block na kore `needs_review=true + review_reason` niye save hoy. Restaurant amber badge dekhe customer-ke confirm kore prepare kore. `allow_bulk=false` store-e `>50 units` direct 422.

&nbsp;

&nbsp;

&nbsp;

### **Active order cap**

&nbsp;

&nbsp;

Ek customer `ACTIVE_STATUSES`-e 5-ta order rakhte pare. 6th `placeOrder/reorder` 422. Eta diye spam + rider load control hoy.

&nbsp;

&nbsp;

&nbsp;

### **Payment state**

&nbsp;

&nbsp;

Order `payment_status pending` diye start. Gateway verify hole `paid`, restaurant cancel + pending hole `cancelled`. Form submit korlei paid dhora hoy na.

&nbsp;

&nbsp;

---

&nbsp;

## **20\. Live location and route**

&nbsp;

&nbsp;

Rider `POST /rider/location {latitude,longitude}` pathale `RiderLocation` + `orders.rider_lat/lng` update hoy. Tracking page polling/map-e rider marker + restaurant/customer coords (Geocoder) + polyline route (`RouteCalculator`/`polyline.js`) dekhay.

&nbsp;

&nbsp;

&nbsp;

**Honest scope:** Current implementation polling-based. Websocket/real-time broadcast future enhancement.

&nbsp;

&nbsp;

&nbsp;

**Relevant files:** `RiderController@updateLocation`, `RiderLocation.php`, `TrackingController@track/route`, `LiveMap.jsx`, `OrderTracking.jsx`.

&nbsp;

&nbsp;

---

&nbsp;

## **21\. Notifications and audit trail**

&nbsp;

&nbsp;

Important event-e `ActivityLog (order_placed, rider_assigned, table_...)` + `AdminNotification (rider assigned/unassigned ...)` create hoy. Admin `activity-log` + `notifications` page theke read/mark-read korte pare.

&nbsp;

&nbsp;

&nbsp;

**Q: Notification database-e keno?**
`Database notification keeps a durable history. The user can read it later, unlike a temporary browser toast.`

&nbsp;

&nbsp;

---

&nbsp;

## **22\. Testing and quality assurance**

&nbsp;

&nbsp;

Run command:

&nbsp;

&nbsp;

php artisan test

&nbsp;

npm run build

&nbsp;

&nbsp;

&nbsp;

Current repo-te automated feature test scaffold (Pest) ache but domain tests ekhono minimal — manual viva test path:

&nbsp;

&nbsp;

&nbsp;

* Guest restaurant list/show dekhte pare, login chara order pare na (401).

&nbsp;

* Customer max cap er beshi qty pathale 422 + clear message.

&nbsp;

* Duplicate lines pathale 422.

&nbsp;

* Stock 0 hole sold-out, order block.

&nbsp;

* Rider second active order accept korte pare na.

&nbsp;

* Takeout-e rider assign block.

&nbsp;

* Pending payment paid hisebe show hoy na.

&nbsp;

&nbsp;

&nbsp;

**Testing answer:** `I test both positive and negative paths — cap bypass, cross-restaurant item, duplicate line, sold-out and double rider assignment all have guarded negative cases.`

&nbsp;

&nbsp;

---

&nbsp;

## **23\. Setup and deployment viva notes**

&nbsp;

&nbsp;

&nbsp;

composer install

copy .env.example .env

php artisan key:generate

php artisan migrate \--seed

php artisan storage:link

php artisan serve

&nbsp;

&nbsp;

&nbsp;

Frontend:

&nbsp;

&nbsp;

npm install

npm run dev

npm run build

&nbsp;

&nbsp;

&nbsp;

**Environment answer:** DB credentials, app key, SSLCommerz store id/password, mail, storage config `.env`-e thake. Secret hard-code kora uchit na. Order limits `.env` (`ORDER_MAX_PER_ITEM` ...) diye tune kora jay.

&nbsp;

&nbsp;

**Production checklist:**

&nbsp;

&nbsp;

&nbsp;

* `APP_ENV=production` and `APP_DEBUG=false`.

&nbsp;

* HTTPS + secure cookies + CORS tighten.

&nbsp;

* DB backup + migrate before release.

&nbsp;

* `storage:link` permission + image cleanup on update/delete.

&nbsp;

* Queue/scheduler for notifications if added.

&nbsp;

* `php artisan config:cache + route:cache` after review.

&nbsp;

&nbsp;

&nbsp;

---

&nbsp;

## **24\. Common problems and answer strategy**

&nbsp;

&nbsp;

&nbsp;

**Q: 422 asche keno order-e?**
`I check validation message — duplicate line, cross-restaurant, over max_per_order/stock/daily_cap, over 50 units, or 5 active orders. Network tab-e response.message dekhi.`

&nbsp;

&nbsp;

**Q: Cart empty hoye jacche?**
`Check restaurantId mismatch (single-restaurant cart replaces), localStorage parse, clampToLimits after checkAvailability, or 401 token expiry.`

&nbsp;

&nbsp;

**Q: Image upload hocche na?**
`Multipart FormData + _method PUT, MIME/size rule, storage disk permission, image_url fallback check kori.`

&nbsp;

&nbsp;

**Q: Rider assign hocche na?**
`Order ready kina, takeout kina, rider approved+online kina, rider-er active order ache kina — ei char condition check kori.`

&nbsp;

&nbsp;

**Q: Tracking map blank?**
`tracking_code valid kina, restaurant/customer lat-lng geocoded kina, RiderLocation polling active kina check kori.`

&nbsp;

&nbsp;

**Q: Database transaction kothay important?**
`Stock check + decrement + Order + OrderItems must succeed together. Partial success prevent korte transaction + rollback use kori.`

&nbsp;

&nbsp;

---

&nbsp;

## **25\. Limitations and future roadmap**

&nbsp;

&nbsp;

&nbsp;

Honest limitations:

&nbsp;

&nbsp;

&nbsp;

* Payment sandbox-first; production webhook signature + reconciliation harden kora baki.

&nbsp;

* Live location polling-based; websocket/broadcast future.

&nbsp;

* No automated Pest feature tests for order-limits yet — manual + build verified.

&nbsp;

* Permission matrix role-level, fine-grained policy future.

&nbsp;

* Delivery fee flat per restaurant; distance-based fee future.

&nbsp;

&nbsp;

&nbsp;

Future roadmap:

&nbsp;

&nbsp;

&nbsp;

1. Coupons/promo + catering bulk checkout.

&nbsp;

2. SMS/push notify + email invoice.

&nbsp;

3. Distance-based fee + ETA prediction.

&nbsp;

4. Fine-grained policies + richer analytics.

&nbsp;

5. Mobile app reusing same API.

&nbsp;

&nbsp;

&nbsp;

**Good answer:** `I clearly separate implemented features from future scope. That makes the project technically honest and easier to extend.`

&nbsp;

&nbsp;

---

&nbsp;

## **26\. Final defense answer pattern**

&nbsp;

&nbsp;

&nbsp;

Jekono feature-er question-e ei structure follow korbe:

&nbsp;

&nbsp;

&nbsp;

&nbsp;

1. **Purpose:** Feature-ta business-e keno dorkar.

&nbsp;

2. **Flow:** User action theke database result porjonto.

&nbsp;

3. **Implementation:** Route, middleware, controller, model/support and React view.

&nbsp;

4. **Security:** Validation, authorization and ownership check.

&nbsp;

5. **Evidence:** Related screen / 422 message / activity log.

&nbsp;

6. **Future scope:** Production-e ki improve kora jabe.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

Example:

&nbsp;

&nbsp;

`Cart limit-er purpose kitchen overload + abuse stop kora. Customer qty select kore, frontend cap kore, checkout checkAvailability diye clamp kore, placeOrder transaction-e stock/limit check kore order banay. Restaurant ownership + server validation + lock diye safe, ar bulk order needs_review badge diye prove kora jay.`

&nbsp;

&nbsp;

&nbsp;

Keep this file open during the defense and answer with the project-er actual flow.

&nbsp;

&nbsp;

---

&nbsp;

*Food Delivery Platform \- Laravel + React Practicum Defense Reference*

&nbsp;

&nbsp;
