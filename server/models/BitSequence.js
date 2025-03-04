import mongoose, {mongo} from "mongoose";

const sequenceSchema = new mongoose.Schema({
    name: {type: String, required: true, unique: true},
    sequence_value: {type: Number, default: 0},
});

const BitSequence = mongoose.model("BitSequence", sequenceSchema);
export default BitSequence;
