const express = require("express");
const auth = require("../../middlewares/auth");
const User = require("../../models/Users");
const router = express.Router();

//@route GET api/auth
//@desc Test Route
//@access Protected
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
})

module.exports = router;