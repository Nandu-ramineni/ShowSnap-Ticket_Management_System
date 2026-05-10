import { customAlphabet } from 'nanoid';
import theatreOwnerModel from '../modules/auth/theatreOwner.model';


// Uppercase letters + numbers
const nanoid = customAlphabet(
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    10
);

export const generateApplicationId = async () => {
    let applicationId;
    let exists = true;

    while (exists) {
        applicationId = `CINE-${nanoid()}`;

        exists = await theatreOwnerModel.exists({
            applicationId,
        });
    }

    return applicationId;
};