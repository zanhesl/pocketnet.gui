PeerTubeHandler = function(app) {

    const apiHandler = {
        baseUrl: 'https://pocketnetpeertube.nohost.me/api/v1/',

        run({method, parameters}) {
            return fetch(`${this.baseUrl}${method}`, parameters);
        },
    };

    this.userToken = '';

    this.registerUser = (userInfo) => {
        return apiHandler.run({
            method: 'users/register',
            parameters: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
        
                body: Object.keys(userInfo).map(key => `${key}=${userInfo[key]}`).join('&')
            },
        })
    };

    this.authentificateUser = async (username, password) => {
        const {
            client_id,
            client_secret,
        } = await apiHandler.run({
            method: 'oauth-clients/local',
        }).then(res => res.json());

        const requestTokenData = {
            client_id,
            client_secret,
            grant_type: 'password',
            response_type: 'code',
            username,
            password,
        }

        const authResult = await fetch(TOKEN_LINK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: Object.keys(requestTokenData).map(key => `${key}=${requestTokenData[key]}`).join('&'),
        }).then(res => res.json());

        return authResult;
    };

    this.uploadVideo = () => {

    };
}