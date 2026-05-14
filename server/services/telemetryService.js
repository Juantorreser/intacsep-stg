import Integration from "../models/Integration.js";
import VehicleMapping from "../models/VehicleMapping.js";
import InboundMessage from "../models/InboundMessage.js";

/**
 * Service to normalize and route inbound telemetry data.
 */
class TelemetryService {
  /**
   * Main entry point for inbound REST telemetry.
   * @param {string} inboundKey - Unique slug for the integration.
   * @param {Object} payload - The raw telemetry data (ident, position, etc.).
   */
  async handleInbound(inboundKey, payload) {
    const integration = await Integration.findOne({ inboundKey, status: "active" });
    if (!integration) {
      throw new Error(`Active integration not found for key: ${inboundKey}`);
    }

    const { ident, position } = payload;
    if (!ident) {
      throw new Error("Missing 'ident' in telemetry payload.");
    }

    // Resolve VehicleMapping by imei / economico / providerIdent.
    const mapping = await VehicleMapping.findOne({
      integrationId: integration._id,
      $or: [
        { imei: ident },
        { economico: ident },
        { providerIdent: ident },
      ],
    });

    // Always log the inbound message for debugging / traceability.
    const baseLog = {
      integrationId: integration._id,
      inboundKey,
      ident,
      position,
      rawBody: payload,
    };

    if (!mapping) {
      console.warn(
        `[inbound] No mapping found for ident '${ident}' in integration '${integration.name}' (${integration._id}).`
      );
      try {
        await InboundMessage.create({
          ...baseLog,
          status: "no_mapping",
          errorMessage: `No VehicleMapping matched ident '${ident}'.`,
          wialonStatus: "skipped",
        });
      } catch (logErr) {
        console.error("[inbound] Failed to persist InboundMessage:", logErr.message);
      }
      return { success: false, message: `No mapping for ident '${ident}'.` };
    }

    if (mapping.status === "pending") {
      mapping.status = "receiving";
      await mapping.save();
    }

    console.log(
      `[inbound] Received telemetry for integration='${integration.name}' ident='${ident}' ` +
      `lat=${position?.latitude} lon=${position?.longitude} speed=${position?.speed}`
    );

    // Decide initial Wialon push state. "pending" if both an integration token
    // and a wialonUnitId are present (the flush worker will pick this up).
    const wialonReady = !!(integration.wialonToken || process.env.WIALON_API_TOKEN) && !!mapping.wialonUnitId;

    try {
      await InboundMessage.create({
        ...baseLog,
        vehicleMappingId: mapping._id,
        status: "ok",
        wialonStatus: wialonReady ? "pending" : "skipped",
      });
    } catch (logErr) {
      console.error("[inbound] Failed to persist InboundMessage:", logErr.message);
    }

    // Wialon delivery is performed asynchronously by the flush worker that
    // calls wialonIntegrationService.pushAllPending() on a timer.
    return { success: true, vehicle: mapping.economico };
  }
}

export default new TelemetryService();
