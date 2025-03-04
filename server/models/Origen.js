import mongoose from "mongoose";

const origenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
});

const Origen = mongoose.model("Origen", origenSchema);

export default Origen;
