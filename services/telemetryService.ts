
export enum TelemetryEvent {
    START_GAME = 'START_GAME',
    FINISH_GAME = 'FINISH_GAME',
}

interface TelemetryData {
    uuid: string;
    timestamp: string;
    action: TelemetryEvent;
    details?: any;
}

class TelemetryService {
    private STORAGE_KEY = 'sn_device_uuid';
    private API_URL = 'https://sportsnote-telemetry.vercel.app/api/log'; // Placeholder URL

    getUUID(): string {
        let uuid = localStorage.getItem(this.STORAGE_KEY);
        if (!uuid) {
            uuid = this.generateUUID();
            localStorage.setItem(this.STORAGE_KEY, uuid);
        }
        return uuid;
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async logEvent(action: TelemetryEvent, details?: any) {
        const data: TelemetryData = {
            uuid: this.getUUID(),
            timestamp: new Date().toISOString(),
            action,
            details,
        };

        console.log('[Telemetry]', data);

        try {
            // Intentar enviar a la API, pero no bloquear si falla
            await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.warn('[Telemetry] Error sending event:', error);
        }
    }
}

export const telemetryService = new TelemetryService();
