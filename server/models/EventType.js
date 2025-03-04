import mongoose, {mongo} from "mongoose";

const eventTypeSchema = new mongoose.Schema(
    {
        eventType: {type: String, required: true},
    },
    {timestamps: true}
);

const EventType = mongoose.model("EventType", eventTypeSchema);
export default EventType;
