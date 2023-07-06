import { peopleApi } from '../config/peopleApi';
import { Auth } from 'googleapis';

export const getUserProfile = async (oauth2Client: Auth.OAuth2Client) => {
    const people = peopleApi(oauth2Client);

    const userInfo = await people.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses,names,photos',
    });

    if (
        !userInfo.data.names ||
        !userInfo.data.emailAddresses ||
        !userInfo.data.photos ||
        !userInfo.data.names[0].displayName ||
        !userInfo.data.emailAddresses[0].value ||
        !userInfo.data.photos[0].url
    )
        throw new Error('user info is not available');

    console.log(
        `From Google People: Fetched Data Of [User ${userInfo.data.emailAddresses[0].value}]`
    );
    return {
        name: userInfo.data.names[0].displayName,
        email: userInfo.data.emailAddresses[0].value,
        picture: userInfo.data.photos[0].url,
    };
};
