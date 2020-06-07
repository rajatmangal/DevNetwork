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


//@route Put api/posts/like/:id
//@desc Add Like by id
//@access Protected
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);
        if (!post) {
            return res.status(404).send("Post Not Found");
        }
        //Check if the post is liked by a user or not.
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({
                msg: 'Post already liked'
            });
        }
        post.likes.unshift({
            user: req.user.id
        });
        await post.save();
        res.json(post.likes);
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(404).send("Post Not Found");
        }
        console.log(err);
        res.status(500).send("Server Error");
    }
});


//@route Put api/posts/unlike/:id
//@desc Unlike Post by id
//@access Protected
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);
        if (!post) {
            return res.status(404).send("Post Not Found");
        }
        //Check if the post is liked by a user or not.
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({
                msg: 'Post has not yet been liked'
            });
        }
        const removeIndex = post.likes.map(like => like.user.toString().indexOf(req.user.id));
        post.likes.splice(removeIndex, 1);
        await post.save();
        res.json(post.likes);
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(404).send("Post Not Found");
        }
        console.log(err);
        res.status(500).send("Server Error");
    }
});

//@route POST api/posts/comment/:id
//@desc Create a Comment on a Post
//@access Protected
router.post('/comment/:id', [auth, [
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
        const post = await Posts.findById(req.params.id);
        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };
        post.comments.unshift(newComment);
        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});

//@route Delete api/posts/comment/:id/:comment_id
//@desc Delete a Comment on a Post
//@access Protected
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const user = await Users.findById(req.user.id).select('-password');
        const post = await Posts.findById(req.params.id);
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        if (!comment) {
            return res.status(404).json({
                msg: "Comment not found"
            });
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(404).json({
                msg: "User not Authorized"
            });
        }

        const removeIndex = post.comments.map(comment => comment.user.toString().indexOf(req.user.id));
        post.comments.splice(removeIndex, 1);
        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});
module.exports = router;