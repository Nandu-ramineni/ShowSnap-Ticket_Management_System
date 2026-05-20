import axios from 'axios';
import logger from './logger.js';

// Fetch geolocation from IP using free ip-api service (limited to 45 req/min)
// Falls back to null if service is unavailable
export const getGeoLocation = async (ip) => {
    if (!ip || ip === 'localhost' || ip === '127.0.0.1' || ip.startsWith('192.168')) {
        return null;
    }

    try {
        const response = await axios.get(`http://ip-api.com/json/${ip}`, {
            params: { fields: 'city,region,country,status' },
            timeout: 2000, // 2 second timeout
        });

        if (response.data.status === 'success') {
            return {
                city: response.data.city || null,
                region: response.data.region || null,
                country: response.data.country || null,
            };
        }
        return null;
    } catch (error) {
        logger.warn(`Geolocation lookup failed for IP ${ip}: ${error.message}`);
        return null;
    }
};

export default getGeoLocation;
