const express = require("express");
const auth = require("../../middlewares/auth");
const User = require("../../models/Users");
const Profile = require("../../models/Profile");
const {
    check,
    validationResult
} = require("express-validator");


const router = express.Router();

//@route GET api/profile/me
//@desc Get current user profile
//@access Protected
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({
                msg: "There is no profile for this user"
            });
        }

        return res.json(profile);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});


//@route POST api/profile
//@desc Create or Update User Profile
//@access Protected
router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        dribbble,
        facebook
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (skills) profileFields.skills = skills;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
        console.log(profileFields.skills);
    }

    //Build Social Skills Array
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (dribbble) profileFields.social.dribbble = dribbble;
    if (facebook) profileFields.social.facebook = facebook;

    try {
        let profile = await Profile.findOne({
            user: req.user.id
        });

        if (profile) {
            //Update the profile
            profile = await Profile.findOneAndUpdate({
                user: req.user.id
            }, {
                $set: profileFields
            }, {
                new: true
            });

            return res.json(profile);
        } else {
            //Create a New Profile
            profile = new Profile(profileFields);
            await profile.save();

            return res.json(profile);
        }

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});


//@route GET api/profile
//@desc Get all Profiles
//@access Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        return res.json(profiles);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});


//@route GET api/profile/user/:id
//@desc Get Profiles by user ID
//@access Public
router.get('/user/:id', async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.id
        }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({
                msg: "Profile not found."
            })
        }
        return res.json(profile);
    } catch (err) {
        console.log(err);
        if (err.kind == "ObjectId") {
            return res.status(400).json({
                msg: "Profile not found."
            })
        }
        res.status(500).send("Server Error");
    }
});

//@route Delete api/profile/
//@desc Delete Profile, User and Posts
//@access Private
router.delete('/', auth, async (req, res) => {
    try {
        //TODO: Remove Users Posts

        //Remove Profile
        await Profile.findOneAndRemove({
            user: req.user.id
        });
        //Remove User
        await User.findByIdAndRemove({
            _id: req.user.id
        });
        res.json({
            msg: "User Removed"
        })
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});

//@route Delete api/profile/experience
//@desc Add User Experience
//@access Private
router.put('/experience', [auth, [
    check('title', 'Title is Required').not().isEmpty(),
    check('company', 'Company is Required').not().isEmpty(),
    check('from', 'From Date is Required').not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;
    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    };
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        });
        profile.experience.unshift(newExp);
        await profile.save();
        return res.json(profile);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});

//@route Delete api/profile/experience/:exp_id
//@desc Delete User Experience
//@access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        });

        //Get Remove Index
        const getRemoveIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(getRemoveIndex, 1);
        await profile.save()
        return res.json(profile);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;