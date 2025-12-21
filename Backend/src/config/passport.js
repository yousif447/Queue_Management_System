const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");

// Check if environment variables exist
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Use environment callback URL or construct from BACKEND_URL
const callbackURL =
  process.env.GOOGLE_CALLBACK_URL ||
  (process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/api/v1/auth/google/callback`
    : "http://localhost:5000/api/v1/auth/google/callback");

// Only configure Google Strategy if we have credentials
if (clientID && clientSecret) {
  console.log("✅ Configuring Google OAuth Strategy...");

  passport.use(
    new GoogleStrategy(
      {
        clientID: clientID,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Get Google profile photo if available
          const googlePhoto = profile.photos && profile.photos.length > 0 
            ? profile.photos[0].value 
            : null;
          
          let user = await User.findOne({ email: profile.emails[0].value });

          if (!user) {
            // Create new user with Google profile photo
            const userData = {
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              authProvider: "google",
              isEmailVerified: true, // Google emails are pre-verified
            };
            
            // Add profile photo if available
            if (googlePhoto) {
              userData.profileImage = googlePhoto;
            }
            
            user = await User.create(userData);
            console.log(`✅ New user created via Google OAuth: ${user.email}${googlePhoto ? ' (with profile photo)' : ''}`);
          } else {
            // If existing user doesn't have a profile image, use Google's
            if (!user.profileImage && googlePhoto) {
              user.profileImage = googlePhoto;
              await user.save({ validateBeforeSave: false });
              console.log(`📸 Updated existing user's profile photo from Google: ${user.email}`);
            }
          }

          done(null, user);
        } catch (err) {
          done(err, null);
        }
      },
    ),
  );

  // Serialize/Deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
} else {
  console.warn("⚠️  Google OAuth is DISABLED - Missing credentials");
  console.warn(
    "   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
  );
}

module.exports = passport;
