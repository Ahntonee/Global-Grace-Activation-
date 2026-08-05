const express = require("express");

const router = express.Router();

const viewController = require("../controllers/viewController");
const shopViewController = require("../controllers/shopViewController");

router.get("/", viewController.home);
router.get("/about", viewController.about);
router.get("/events", viewController.events);
router.get("/speakers", viewController.speakers);
router.get("/watch-live", viewController.watchLive);
router.get("/give", viewController.give);
router.get("/gallery", viewController.gallery);
router.get("/blog", viewController.blogList);
router.get("/blog/:slug", viewController.blogPost);
router.get("/contact", viewController.contact);
router.get("/faqs", viewController.faqs);
router.get("/prayer", viewController.prayer);
router.get("/testimonies", viewController.testimonies);
router.get("/volunteer", viewController.volunteer);

router.get("/shop", shopViewController.shopList);
router.get("/shop/:slug", shopViewController.productDetail);
router.get("/cart", shopViewController.cart);
router.get("/checkout", shopViewController.checkout);
router.get("/order-confirmation", shopViewController.orderConfirmation);
router.get("/give/confirmation", shopViewController.giveConfirmation);
router.get("/checkout/mock", shopViewController.mockCheckout);

module.exports = router;
