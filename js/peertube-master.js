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

    this.authentificateUser = async (clbk) => {
        const privateKey = app.user.keys().privateKey;

        const username = bitcoin.crypto.sha256(Buffer.from(privateKey.slice(0, (privateKey.length / 2).toFixed(0)))).toString('hex').slice(0,10);
        const password = bitcoin.crypto.sha256(Buffer.from(privateKey.slice((privateKey.length / 2).toFixed(0), privateKey.length))).toString('hex');

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
            username: 'zanhesl',
            password: '19982402UjL',
        }

        const authResult = await apiHandler.run({
            method: 'users/token',
            parameters: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: Object.keys(requestTokenData).map(key => `${key}=${requestTokenData[key]}`).join('&'),
            }
        }).then(res => res.json())
          .then(async (data) => {
            if (data.access_token) this.userToken = data.access_token;

            if (!data.error) {
                if (clbk) {
                    clbk();
                }
                return data;
            };
            
            if (data.code === 'invalid_grant') {
                console.log('UNREGISTERED');
                const registerData = await this.registerUser({
                    username,
                    password,
                    email: `${username}@pocketnet.app`,
                });

                console.log('>>>>>>>reply status', registerData.status);

                const retryAuth = await apiHandler.run({
                    method: 'users/token',
                    parameters: {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: Object.keys(requestTokenData).map(key => `${key}=${requestTokenData[key]}`).join('&'),
                    }
                }).then(res => {
                    if (res.access_token) this.userToken = res.access_token;

                    if (clbk) clbk();

                    return res.json();
                });

                return retryAuth;
            }

            return data;
          })

        return authResult;
    };

    this.uploadVideo = () => {
        
    };


}