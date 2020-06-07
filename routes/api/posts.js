const express = require("express");
const {
    check,
    validationResult
} = require("express-validator");

const auth = require("../../middlewares/auth");
const Posts = require("../../models/Posts");
const Users = require("../../models/Users");
const Profile = require("../../models/Profile");
const router = express.Router();

//@route POST api/posts
//@desc Create a Post
//@access Protected
router.post('/', [auth, [
    check('text', 'Text is Required.').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({
            errors: errors.array()
        });
    }

    try {
        const user = await Users.findById(req.user.id).select('-password');
        const newPost = new Posts({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });
        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
})

module.exports = router;