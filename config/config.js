{
    "webPort": 8000,
    "audioCodec": "PCMU",
    "stunServer": "stun.sipnet.ru:3478",
    "dataStorageDays": 100,
    "bitrix24": {
        "portal_link": "",
        "client_id": "",
        "client_secret": "",
        "grant_type": "",
        "redirect_uri": ""
    },
    "repository": "https://raw.githubusercontent.com/komunikator/mars/master/package.json",
    "webAccounts": [
        {
            "username": "admin",
            "password": "admin"
        },
        {
            "username": "user_XXXXXXXXXX"
        }
    ],
    "trustedNet": {
        "tokenURL": "https://net.trusted.ru/idp/sso/oauth/token",
        "profileURL": "https://net.trusted.ru/trustedapp/rest/person/profile/get",
        "redirect_uri": "/auth/trusted",
        "client_id": "TRUSTED_LOGIN_CLIENT_ID",
        "client_secret": "TRUSTED_LOGIN_CLIENT_SECRET"
    },
    "maxCalls": 10,
    "ringingTimeout": "90",
    "serviceName": "MARS",
    "activeAccount": 0,
    "def_tts": "yandex",
    "ivona_speech": {
        "accessKey": "",
        "secretKey": "",
        "language": "ru-RU",
        "name": "Tatyana",
        "gender": "Female"
    },
    "recognize": {
        "type": "yandex",
        "options": {
            "developer_key": "",
            "model": "general"
        }
    },
    "sipAccounts": {
        "1": {
            "host": "multifon.ru",
            "expires": 60,
            "user": "USER",
            "password": "PASSWORD",
            "disable": 1
        },
        "6": {
            "host": "multifon.ru",
            "password": "yphsOPfbc",
            "expires": 60,
            "user": "79297331427",
            "disable": 0
        }
    },
    "b24accounts": {
        "test1": {
            "disable": 1,
            "clientId": "APP_CLIENT_ID",
            "clientSecret": "APP_CLIENT_SECRET",
            "portalLink": "LINK_MY_PORTAL_BITRIX24",
            "redirectUri": "MY_DOMAIN:PORT"
        }
    },
    "levels": {
        "[all]": "trace",
        "http": "error"
    },
    "replaceConsole": "false",
    "appenders": [
        {
            "type": "console",
            "category": [
                "console",
                "server",
                "ua",
                "call",
                "task",
                "error",
                "http",
                "rotation",
                "sip_proxy"
            ]
        },
        {
            "type": "file",
            "filename": "logs/error.log",
            "maxLogSize": 1048576,
            "backups": 3,
            "category": "error"
        },
        {
            "type": "file",
            "filename": "logs/server.log",
            "maxLogSize": 1048576,
            "backups": 3,
            "category": "server"
        },
        {
            "type": "file",
            "filename": "logs/ua.log",
            "maxLogSize": 1048576,
            "backups": 10,
            "category": "ua"
        },
        {
            "type": "file",
            "filename": "logs/sip.log",
            "maxLogSize": 1048576,
            "backups": 10,
            "category": "sip"
        },
        {
            "type": "file",
            "filename": "logs/call.log",
            "maxLogSize": 1048576,
            "backups": 10,
            "category": "call"
        },
        {
            "type": "file",
            "filename": "logs/remoteClient.log",
            "maxLogSize": 1048576,
            "backups": 10,
            "category": "remoteClient"
        },
        {
            "type": "file",
            "filename": "logs/task.log",
            "maxLogSize": 1048576,
            "backups": 10,
            "category": "task"
        },
        {
            "type": "file",
            "filename": "logs/http.log",
            "maxLogSize": 1048576,
            "backups": 10,
            "category": "http"
        },
        {
            "type": "file",
            "filename": "logs/cdr.log",
            "maxLogSize": 1048576,
            "backups": 10,
            "category": "cdr"
        },
        {
            "type": "file",
            "filename": "logs/rotation.log",
            "maxLogSize": 1048576,
            "backups": 10,
            "category": "rotation"
        },
        {
            "type": "file",
            "filename": "logs/sip_proxy.log",
            "maxLogSize": 1048576,
            "backups": 10,
            "category": "sip_proxy"
        }
    ],
    "sipServer": "disable"
}