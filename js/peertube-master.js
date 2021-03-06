PeerTubeHandler = function (app) {
  const hardCodeUrlsList = [
    'pocketnetpeertube3.nohost.me',
    'pocketnetpeertube4.nohost.me',
  ];

  const VIDEO_QUOTA_CORRECTION = 100 * 1024 * 1024;

  let randomServer =
    hardCodeUrlsList[Math.floor(Math.random() * hardCodeUrlsList.length)];

  let baseUrl = `https://${randomServer}/api/v1/`;

  let watchUrl = `https://${randomServer}/videos/watch/`;

  this.peertubeId = 'peertube://';

  const apiHandler = {
    upload({ method, parameters }) {
      return $.ajax({
        url: `${baseUrl}${method}`,
        ...parameters,
      })
        .done((res) => {
          parameters.success(res);
        })
        .fail((res) => parameters.fail(res));
    },

    run({ method, parameters, url }) {
      if (!url) url = `${baseUrl}${method}`;

      return fetch(url, parameters)
        .then((res) => res.json())
        .catch((err) => {
          return { error: err };
        });
    },
  };

  const makeBodyFromObject = (objectToHandle) => {
    return Object.keys(objectToHandle)
      .map((key) => `${key}=${objectToHandle[key]}`)
      .join('&');
  };

  this.userToken = '';
  this.refreshToken = '';

  this.clientAuthInfo = {};

  this.userName = '';
  this.password = '';
  this.uploadProgress = 0;

  this.getServerInfo = () => {
    return app.api
      .fetch('peertube/best')
      .then((data) => {
        if (!data.fastest && !data.leastUsed) return;

        this.setActiveServer((data.fastest || data.leastUsed).server);
      })
      .catch(() => {});
  };

  this.setActiveServer = (server) => {
    [baseUrl, watchUrl, randomServer] = [
      `https://${server}/api/v1/`,
      `https://${server}/videos/watch/`,
      server,
    ];
  };

  this.registerUser = (userInfo) => {
    return apiHandler.run({
      method: 'users/register',
      parameters: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },

        body: Object.keys(userInfo)
          .map((key) => `${key}=${userInfo[key]}`)
          .join('&'),
      },
    });
  };

  this.authentificateUser = async (clbk) => {
    await this.getServerInfo();

    const { client_id, client_secret } = await apiHandler
      .run({
        method: 'oauth-clients/local',
      })
      .then((res) => {
        return res.json ? res.json() : res;
      });

    if (!client_id || !client_secret) {
      clbk({ error: 'Cannot retrieve user data from this server' });

      return {};
    }

    this.clientAuthInfo = { client_id, client_secret };

    return axios
      .post(
        `https://${randomServer}/plugins/pocketnet-auth/router/code-cb`,
        serialize(app.user.signature()),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      .then(async (res) => {
        const requestTokenData = {
          client_id,
          client_secret,
          grant_type: 'password',
          response_type: 'code',
          ...res.data,
        };

        const authResult = await apiHandler
          .run({
            method: 'users/token',
            parameters: {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: makeBodyFromObject(requestTokenData),
            },
          })
          .then((res) => {
            return res.json ? res.json() : res;
          })
          .then(async (data) => {
            if (data.access_token) this.userToken = data.access_token;
            if (data.refresh_token) this.refreshToken = data.refresh_token;

            if (!data.error) {
              if (clbk) {
                clbk();
              }

              return data;
            }

            return clbk({ error: data.error });
          });

        return authResult;
      })
      .catch((err) =>
        clbk({
          error: err ? err.err : 'Cannot retrieve user data from this server',
        }),
      );
  };

  this.refreshUserToken = async () => {
    const refreshBody = {
      ...this.clientAuthInfo,
      refresh_token: this.refreshToken,
      response_type: 'code',
      grant_type: 'refresh_token',
    };

    return axios
      .post(`${baseUrl}users/token`, makeBodyFromObject(refreshBody), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .then((res) => (res.json ? res.json() : res.data))
      .then((json) => {
        if (json.access_token) this.userToken = json.access_token;
        if (json.refresh_token) this.refreshToken = json.refresh_token;

        return { status: 'success' };
      })
      .catch((err) => ({ err }));
  };

  this.getChannel = async () => {
    return axios
      .get(`${baseUrl}users/me`, {
        headers: {
          Authorization: `Bearer ${this.userToken}`,
        },
      })
      .then((res) => ({
        channelId: res.data.videoChannels[0].id,
        videoQuotaDaily: res.data.videoQuotaDaily,
      }))
      .catch(async (err) => {
        const refreshResult = await this.refreshUserToken();

        if (refreshResult.err)
          return sitemessage('Unable to refresh user token');

        return axios
          .get(`${baseUrl}users/me`, {
            headers: {
              Authorization: `Bearer ${this.userToken}`,
            },
          })
          .then((res) => ({
            channelId: res.data.videoChannels[0].id,
            videoQuotaDaily: res.data.videoQuotaDaily,
          }))
          .catch(() => sitemessage('Unable to get channel info'));
      });
  };

  this.getUserQuota = async () => {
    return axios
      .get(`${baseUrl}users/me/video-quota-used`, {
        headers: {
          Authorization: `Bearer ${this.userToken}`,
        },
      })
      .then((res) => res.data)
      .catch(() =>
        sitemessage(
          'Unable to check daily videos quota, you upload may be rejected',
        ),
      );
  };

  this.uploadVideo = async (parameters) => {
    const { channelId, videoQuotaDaily } = await this.getChannel();

    const { videoQuotaUsedDaily } = await this.getUserQuota();

    if (
      parameters.video.size + videoQuotaUsedDaily >=
      videoQuotaDaily - VIDEO_QUOTA_CORRECTION
    ) {
      return parameters.successFunction({
        error: `Video exceeds the daily upload limit`,
      });
    }

    var videoName =
      parameters.name || `${this.userName}:${new Date().toISOString()}`;

    const bodyOfQuery = {
      privacy: 1,
      'scheduleUpdate[updateAt]': new Date().toISOString(),
      channelId: channelId,
      name: videoName,
      videofile: parameters.video,
    };

    if (parameters.image) {
      const imageString = await getBase64(parameters.image);

      const format = parameters.image.type.replace('image/', '');

      const newImg = await resizeNew(imageString, 1920, 1080, format);

      const fileImage = dataURLtoFile(newImg, parameters.image.name);

      bodyOfQuery.previewfile = fileImage;
      bodyOfQuery.thumbnailfile = fileImage;
    }

    const formData = new FormData();

    Object.keys(bodyOfQuery).map((key) =>
      formData.append(key, bodyOfQuery[key]),
    );

    const CancelToken = axios.CancelToken;

    return axios
      .post(`${baseUrl}videos/upload`, formData, {
        headers: {
          Authorization: `Bearer ${this.userToken}`,
        },

        onUploadProgress: (evt) => {
          const percentCompleted = Math.round((evt.loaded * 100) / evt.total);

          this.uploadProgress = percentCompleted;
          parameters.uploadFunction(percentCompleted);
        },

        cancelToken: new CancelToken((c) => parameters.cancelClbk(c)),
      })
      .then((res) => {
        const json = res.data;

        if (!json.video) return parameters.successFunction('error');

        parameters.successFunction(
          this.composeLink(randomServer, json.video.uuid),
          videoName,
          // `${this.peertubeId}${watchUrl}${json.video.uuid}`,
        );
      })
      .catch((res) => {
        return parameters.successFunction({ error: res });
      });
  };

  this.composeLink = function (host, videoid) {
    return this.peertubeId + host + '/' + videoid;
  };

  this.parselink = function (link) {

    var ch = link.replace(this.peertubeId, '').split('/');

    return {
      host: ch[0],
      id: ch[1],
    };
  };

  this.removeVideo = async (video) => {
    const videoHost = this.parselink(video).host;
    const videoId = this.parselink(video).id;

    /*  .replace('peertube://', '')
      .replace('https://', '')
      .split('/')[0];*/

    if (randomServer !== videoHost) {
      this.baseUrl = videoHost ? `https://${videoHost}/api/v1` : this.baseUrl;

      await this.authentificateUser();
    }

    if (!this.userToken) {
      const localAuth = () =>
        apiHandler.run({
          method: `videos/${videoId}`,
          parameters: {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${this.userToken}`,
            },
          },
        });

      return this.authentificateUser(localAuth);
    }

    apiHandler.run({
      method: `videos/${videoId}`,
      parameters: {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.userToken}`,
        },
      },
    });
  };

  this.startLive = async (parameters = {}) => {
    const channelInfo = await this.getChannel();

    const bodyOfQuery = {
      privacy: 1,
      'scheduleUpdate[updateAt]': new Date().toISOString(),
      channelId: channelInfo.id,
      name: parameters.name || `${this.userName}:${new Date().toISOString()}`,
    };

    if (parameters.image) {
      bodyOfQuery.previewfile = parameters.image;
      bodyOfQuery.thumbnailfile = parameters.image;
    }

    const formData = new FormData();

    Object.keys(bodyOfQuery).map((key) =>
      formData.append(key, bodyOfQuery[key]),
    );

    apiHandler.upload({
      method: 'videos/live',
      parameters: {
        type: 'POST',
        method: 'POST',
        contentType: false,
        processData: false,
        data: formData,
        headers: {
          Authorization: `Bearer ${this.userToken}`,
        },

        xhr: () => {
          const xhr = $.ajaxSettings.xhr(); // получаем объект XMLHttpRequest
          xhr.upload.addEventListener(
            'progress',
            function (evt) {
              // добавляем обработчик события progress (onprogress)
              if (evt.lengthComputable) {
                const percentComplete = (evt.loaded / evt.total) * 100;

                this.uploadProgress = percentComplete;
                parameters.uploadFunction(percentComplete);
              }
            },
            false,
          );
          return xhr;
        },

        success: (json) => {
          if (!json.video) return parameters.successFunction('error');

          return this.getLiveInfo(json.video.uuid, {
            successFunction: parameters.successFunction,
          });
        },

        fail: (res) => {
          return parameters.successFunction({ error: res });
        },
      },
    });
  };

  this.getLiveInfo = async (id = '', parameters = {}) => {
    apiHandler
      .run({
        method: `videos/live/${id}`,
        parameters: {
          type: 'GET',
          headers: {
            Authorization: `Bearer ${this.userToken}`,
          },
        },
      })
      .then((res) => {
        if (res.error) {
          return parameters.successFunction(res);
        }

        return parameters.successFunction({
          video: `${this.peertubeId}${watchUrl}${id}`,
          ...res,
        });
      });
  };

  this.importVideo = async (parameters = {}) => {
    const channelInfo = await this.getChannel();

    const bodyOfQuery = {
      privacy: 1,
      'scheduleUpdate[updateAt]': new Date().toISOString(),
      channelId: channelInfo.id,
      // name: parameters.name || `${this.userName}:${new Date().toISOString()}`,
      targetUrl: parameters.url,
    };

    const formData = new FormData();

    Object.keys(bodyOfQuery).map((key) =>
      formData.append(key, bodyOfQuery[key]),
    );

    apiHandler.upload({
      method: 'videos/imports',
      parameters: {
        type: 'POST',
        method: 'POST',
        contentType: false,
        processData: false,
        data: formData,
        headers: {
          Authorization: `Bearer ${this.userToken}`,
        },

        xhr: () => {
          const xhr = $.ajaxSettings.xhr(); // получаем объект XMLHttpRequest
          xhr.upload.addEventListener(
            'progress',
            function (evt) {
              // добавляем обработчик события progress (onprogress)
              if (evt.lengthComputable) {
                const percentComplete = (evt.loaded / evt.total) * 100;

                this.uploadProgress = percentComplete;
                parameters.uploadFunction(percentComplete);
              }
            },
            false,
          );
          return xhr;
        },

        success: (json) => {
          if (!json.video) return parameters.successFunction('error');

          parameters.successFunction(
            `${this.peertubeId}${watchUrl}${json.video.uuid}`,
          );
        },

        fail: (res) => {
          return parameters.successFunction({ error: res });
        },
      },
    });
  };

  this.updateVideo = async (id = '', options = {}, parameters = {}) => {
    if (!this.userToken) {
      await parameters.server ? this.setActiveServer(parameters.server) : this.getServerInfo();

      await this.authentificateUser();
    }

    const preparedOptions = { ...options };
    const formData = new FormData();

    if (options.thumbnailfile) {
      const imageString = await getBase64(options.thumbnailfile);

      const format = options.thumbnailfile.type.replace('image/', '');

      const newImg = await resizeNew(imageString, 1920, 1080, format);

      preparedOptions.thumbnailfile = dataURLtoFile(
        newImg,
        options.thumbnailfile.name,
      );
      preparedOptions.previewfile = dataURLtoFile(
        newImg,
        options.thumbnailfile.name,
      );
    }

    Object.keys(preparedOptions).map((key) =>
      formData.append(key, preparedOptions[key]),
    );

    return axios.put(`${baseUrl}videos/${id}`, formData, {
      headers: {
        Authorization: `Bearer ${this.userToken}`,
      },
    });
  };

  this.getVideoInfoAnon = async (meta, clbk) => {
    apiHandler
      .run({
        url: `https://${meta.host_name}/api/v1/videos/${meta.id}`,

        parameters: {
          method: 'GET',
        },
      })
      .then((res) => clbk(res));
  };
};


