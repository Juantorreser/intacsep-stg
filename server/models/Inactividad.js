import mongoose from "mongoose";

const InactividadSchema = new mongoose.Schema({
    name: {type: String, required: true, unique: true},
    value: {type: Number, default: 0}, //seconds
});

const Inactividad = mongoose.model("Inactividad", InactividadSchema);

export default Inactividad;
