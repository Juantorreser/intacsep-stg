import mongoose, {mongo} from "mongoose";

const monitoreoSchema = new mongoose.Schema(
    {
        tipoMonitoreo: {type: String, required: true},
    },
    {timestamps: true}
);

const Monitoreo = mongoose.model("monitoreo", monitoreoSchema);
export default Monitoreo;
