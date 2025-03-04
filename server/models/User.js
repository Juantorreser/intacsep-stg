import mongoose, {mongo} from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true, minLength: 5},
        firstName: {type: String, required: true},
        lastName: {type: String, required: true},
        phone: {type: String, default: ""},
        countryKey: {type: String, default: ""},
        role: {type: String},
        refresh_token: String,
    },
    {timestamps: true}
);

const User = mongoose.model("User", UserSchema);
export default User;
