-- Clear existing products
TRUNCATE TABLE public.products CASCADE;

-- Insert 40 Amazon Products with Affiliate Tag
INSERT INTO public.products (name, description, category, subcategory, price, affiliate_link, image_url, rating, review_count, recommended_for, is_featured) VALUES

-- SKINCARE (15 Items)
('CeraVe Hydrating Facial Cleanser', 'Daily face wash for normal to dry skin with ceramides and hyaluronic acid.', 'skincare', 'cleanser', 14.99, 'https://www.amazon.com/dp/B01N1LL62W?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/510f-2-hKRL._SL1000_.jpg', 4.8, 85000, ARRAY['dry_skin', 'sensitive_skin', 'daily_care'], true),

('La Roche-Posay Toleriane Hydrating Gentle Cleanser', 'Daily face wash for normal to dry sensitive skin.', 'skincare', 'cleanser', 16.99, 'https://www.amazon.com/dp/B01N1LL62W?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/51V9S3vC9GL._SL1000_.jpg', 4.7, 42000, ARRAY['dry_skin', 'sensitive_skin'], false),

('Neutrogena Hydro Boost Water Gel', 'Hyaluronic acid water gel moisturizer for dry skin.', 'skincare', 'moisturizer', 19.50, 'https://www.amazon.com/dp/B00NR1YQHM?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71OS+yI6D1L._SL1500_.jpg', 4.6, 95000, ARRAY['dry_skin', 'hydration'], true),

('Paula''s Choice Skin Perfecting 2% BHA Liquid Exfoliant', 'Salicylic acid exfoliant for blackheads, pores, and wrinkles.', 'skincare', 'exfoliant', 34.00, 'https://www.amazon.com/dp/B00949CTQQ?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/61-a-eI+tJL._SL1500_.jpg', 4.5, 75000, ARRAY['acne', 'texture', 'blackheads'], true),

('EltaMD UV Clear Facial Sunscreen SPF 46', 'Oil-free sunscreen for sensitive or acne-prone skin.', 'skincare', 'sunscreen', 41.00, 'https://www.amazon.com/dp/B002MSN3QQ?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/51w-6-aB-AL._SL1000_.jpg', 4.7, 35000, ARRAY['acne', 'sensitive_skin', 'sun_protection'], true),

('CeraVe Vitamin C Serum', 'Skin brightening serum with 10% pure vitamin C.', 'skincare', 'serum', 21.99, 'https://www.amazon.com/dp/B07V8J3G4V?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71VSPqDlrwL._SL1500_.jpg', 4.5, 38000, ARRAY['brightening', 'anti_aging'], false),

('The Ordinary Niacinamide 10% + Zinc 1%', 'Vitamin and mineral blemish formula.', 'skincare', 'serum', 12.50, 'https://www.amazon.com/dp/B06XF7S3P8?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/51-3-s-I-2L._SL1000_.jpg', 4.6, 25000, ARRAY['acne', 'oil_control'], false),

('Vanicream Moisturizing Skin Cream', 'Fragrance-free moisturizer for sensitive skin.', 'skincare', 'moisturizer', 16.49, 'https://www.amazon.com/dp/B000NWGCZ2?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/61S-u-i-c2L._SL1500_.jpg', 4.8, 50000, ARRAY['sensitive_skin', 'eczema'], false),

('CeraVe PM Facial Moisturizing Lotion', 'Ultra-lightweight night moisturizer.', 'skincare', 'moisturizer', 15.30, 'https://www.amazon.com/dp/B00365DABC?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71m-4-J-k2L._SL1500_.jpg', 4.7, 65000, ARRAY['night_routine', 'barrier_repair'], false),

('Thayers Alcohol-Free Rose Petal Witch Hazel Toner', 'Facial toner with aloe vera formula.', 'skincare', 'toner', 10.95, 'https://www.amazon.com/dp/B00016XJ4M?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71G+t-l-u2L._SL1500_.jpg', 4.7, 88000, ARRAY['toning', 'hydration'], false),

('PanOxyl Acne Foaming Wash', 'Benzoyl peroxide 10% maximum strength antimicrobial.', 'skincare', 'cleanser', 9.79, 'https://www.amazon.com/dp/B0043O5W4Y?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/61s-3-z-r2L._SL1500_.jpg', 4.6, 45000, ARRAY['acne', 'body_acne'], false),

('Differin Adapalene Gel 0.1%', 'Retinoid treatment for acne.', 'skincare', 'treatment', 14.99, 'https://www.amazon.com/dp/B01M114813?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71o-9-u-r2L._SL1500_.jpg', 4.5, 55000, ARRAY['acne', 'scars'], false),

('Mighty Patch Original', 'Hydrocolloid acne pimple patch.', 'skincare', 'treatment', 12.99, 'https://www.amazon.com/dp/B074PVTPBW?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/61Y-1-e-a2L._SL1000_.jpg', 4.8, 120000, ARRAY['acne', 'emergency'], false),

('Bio-Oil Skincare Oil', 'Improves appearance of scars and stretch marks.', 'skincare', 'treatment', 13.99, 'https://www.amazon.com/dp/B004AI97MA?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71r-9-u-r2L._SL1500_.jpg', 4.6, 98000, ARRAY['scars', 'body_care'], false),

('Supergoop! Unseen Sunscreen SPF 40', 'Invisible, weightless, scentless daily primer and sunscreen.', 'skincare', 'sunscreen', 38.00, 'https://www.amazon.com/dp/B0788M6Y52?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/51t-6-aB-AL._SL1000_.jpg', 4.7, 22000, ARRAY['sun_protection', 'makeup_primer'], true),


-- GROOMING (12 Items)
('Philips Norelco Multigroom Series 7000', '18-piece all-in-one trimmer.', 'grooming', 'trimmer', 59.99, 'https://www.amazon.com/dp/B07145GM4B?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.7, 150000, ARRAY['beard', 'hair', 'body_grooming'], true),

('Braun Electric Razor Series 7', '360 flex head electric shaver.', 'grooming', 'shaver', 139.99, 'https://www.amazon.com/dp/B07Z5KCK7H?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.5, 18000, ARRAY['shaving', 'clean_shave'], false),

('Gillette Fusion5 ProGlide Razor', 'Men''s razor handle + 2 refills.', 'grooming', 'shaver', 19.99, 'https://www.amazon.com/dp/B0039LMT5U?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/81e-2-g-r2L._SL1500_.jpg', 4.7, 45000, ARRAY['shaving', 'precision'], false),

('Jack Black Beard Lube', 'Conditioning shave cream and pre-shave oil.', 'grooming', 'shave_cream', 18.00, 'https://www.amazon.com/dp/B0001EL5Q8?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/61t-6-aB-AL._SL1000_.jpg', 4.8, 12000, ARRAY['shaving', 'sensitive_skin'], true),

('Honest Amish Beard Balm', 'Leave-in conditioner with natural oils.', 'grooming', 'beard_care', 12.87, 'https://www.amazon.com/dp/B009NNFBG0?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/81p-6-aB-AL._SL1500_.jpg', 4.5, 28000, ARRAY['beard', 'conditioning'], false),

('Viking Revolution Beard Oil', 'Conditioner for beard growth and dandruff.', 'grooming', 'beard_care', 9.88, 'https://www.amazon.com/dp/B01MXU4R7E?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.6, 35000, ARRAY['beard', 'softness'], false),

('Tweezerman Stainless Steel Slant Tweezer', 'Expert brow shaping tool.', 'grooming', 'tools', 23.00, 'https://www.amazon.com/dp/B0000Y3GSE?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/51t-6-aB-AL._SL1000_.jpg', 4.8, 40000, ARRAY['brows', 'maintenance'], false),

('NIVEA Men Sensitive Post Shave Balm', 'Soothing balm for after shaving.', 'grooming', 'aftershave', 6.89, 'https://www.amazon.com/dp/B01539X5TA?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/61t-6-aB-AL._SL1500_.jpg', 4.7, 30000, ARRAY['shaving', 'soothing'], false),

('Philips Sonicare ProtectiveClean 4100', 'Rechargeable electric toothbrush.', 'grooming', 'dental', 49.96, 'https://www.amazon.com/dp/B078GV2K95?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.7, 85000, ARRAY['teeth', 'hygiene'], true),

('Crest 3D Whitestrips', 'Professional effects teeth whitening kit.', 'grooming', 'dental', 45.99, 'https://www.amazon.com/dp/B00AHAWWO0?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/81t-6-aB-AL._SL1500_.jpg', 4.6, 75000, ARRAY['teeth', 'whitening'], false),

('MANSCAPED The Lawn Mower 5.0 Ultra', 'Electric groin hair trimmer with SkinSafe foil blade.', 'grooming', 'trimmer', 109.99, 'https://www.amazon.com/dp/B0CTD2Z3Q8?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.6, 5000, ARRAY['body_grooming', 'hygiene'], true),

('Duke Cannon Supply Co. Big Ass Brick of Soap', 'Naval diplomacy scent men''s soap.', 'grooming', 'body_wash', 9.00, 'https://www.amazon.com/dp/B00A8S6S6S?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/81t-6-aB-AL._SL1500_.jpg', 4.7, 15000, ARRAY['shower', 'body_wash'], false),


-- FITNESS (8 Items)
('Fitbit Charge 6', 'Fitness tracker with heart rate and GPS.', 'fitness', 'tracker', 159.95, 'https://www.amazon.com/dp/B0CC673B8Y?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/61t-6-aB-AL._SL1500_.jpg', 4.4, 5000, ARRAY['tracking', 'cardio'], true),

('Bowflex SelectTech 552 Adjustable Dumbbells', 'Pair of adjustable weights 5-52.5 lbs.', 'fitness', 'equipment', 429.00, 'https://www.amazon.com/dp/B001ARYU58?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.8, 25000, ARRAY['strength', 'home_gym'], true),

('Optimum Nutrition Gold Standard 100% Whey', 'Double rich chocolate protein powder.', 'fitness', 'supplements', 84.99, 'https://www.amazon.com/dp/B000QSNYGI?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.7, 110000, ARRAY['muscle_building', 'nutrition'], false),

('Creatine Monohydrate Powder', 'Micronized creatine for muscle growth.', 'fitness', 'supplements', 29.99, 'https://www.amazon.com/dp/B002DYIZEO?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.7, 60000, ARRAY['strength', 'muscle_building'], false),

('Resistance Bands Set', 'Workout bands with door anchor and handles.', 'fitness', 'equipment', 29.99, 'https://www.amazon.com/dp/B07DZKCZ4N?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.6, 40000, ARRAY['mobility', 'strength'], false),

('Perfect Fitness Ab Carver Pro', 'Roller for core workouts.', 'fitness', 'equipment', 39.99, 'https://www.amazon.com/dp/B00B1N0R6C?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/81t-6-aB-AL._SL1500_.jpg', 4.6, 20000, ARRAY['abs', 'core'], false),

('Theragun Prime', 'Percussive therapy massage gun.', 'fitness', 'recovery', 299.00, 'https://www.amazon.com/dp/B086Z29M2P?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.8, 8000, ARRAY['recovery', 'massage'], false),

('BlenderBottle Classic V2', 'Shaker bottle for protein shakes.', 'fitness', 'accessories', 10.99, 'https://www.amazon.com/dp/B07S2S6J45?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/61t-6-aB-AL._SL1500_.jpg', 4.8, 95000, ARRAY['nutrition', 'convenience'], false),


-- STYLE (5 Items)
('Ray-Ban Classic Aviator Sunglasses', 'Timeless aviator design.', 'style', 'accessories', 163.00, 'https://www.amazon.com/dp/B00080J3B0?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/51t-6-aB-AL._SL1000_.jpg', 4.6, 15000, ARRAY['classic', 'essentials'], true),

('Casio G-Shock DW5600E-1V', 'Durable digital watch.', 'style', 'accessories', 49.95, 'https://www.amazon.com/dp/B000GAYQKY?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/61t-6-aB-AL._SL1000_.jpg', 4.8, 28000, ARRAY['everyday_carry', 'rugged'], false),

('Hanes Men''s Beefy-T Crew Neck', 'Heavyweight cotton t-shirts, pack of 2.', 'style', 'clothing', 16.00, 'https://www.amazon.com/dp/B003XDJH38?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.6, 65000, ARRAY['basics', 'essentials'], false),

('Timberland Men''s Blix Slimfold Wallet', 'Leather bifold wallet.', 'style', 'accessories', 19.99, 'https://www.amazon.com/dp/B000BQ0B0G?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/81t-6-aB-AL._SL1500_.jpg', 4.7, 45000, ARRAY['essentials', 'leather'], false),

('Adidas Men''s Adilette Shower Slides', 'Comfortable post-workout slides.', 'style', 'footwear', 25.00, 'https://www.amazon.com/dp/B01H6422XG?tag=gteifel20-20', 'https://m.media-amazon.com/images/I/71t-6-aB-AL._SL1500_.jpg', 4.6, 85000, ARRAY['casual', 'recovery'], false);
