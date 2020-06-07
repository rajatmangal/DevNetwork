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


//@route GET api/posts
//@desc Get All Posts
//@access Protected
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Posts.find().sort({
            date: -1
        });
        res.json(posts);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});


//@route GET api/posts/:id
//@desc Get Post By Id
//@access Protected
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);
        if (!post) {
            return res.status(404).send("Post Not Found");
        }
        return res.json(post);
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(404).send("Post Not Found");
        }
        console.log(err);
        res.status(500).send("Server Error");
    }
});


//@route Delete api/posts/:id
//@desc Delete Post By Id
//@access Protected
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);
        if (!post) {
            return res.status(404).send("Post Not Found");
        }
        if (post.user.toString() !== req.user.id) {
            return res.status(401).send("User Not Authorized");
        }
        await post.remove();
        return res.json({
            msg: "Post Removed"
        });
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(404).send("Post Not Found");
        }
        console.log(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;