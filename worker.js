let cache = { token: null, exp: 0, user: null }


async function token(env) {
if (cache.token && Date.now() < cache.exp) return cache.token


const r = await fetch("https://id.twitch.tv/oauth2/token", {
method: "POST",
body: new URLSearchParams({
client_id: env.TWITCH_CLIENT_ID,
client_secret: env.TWITCH_CLIENT_SECRET,
grant_type: "client_credentials"
})
})


const j = await r.json()
cache.token = j.access_token
cache.exp = Date.now() + (j.expires_in - 60) * 1000
return cache.token
}


async function userId(env, t) {
if (cache.user) return cache.user


const r = await fetch(`https://api.twitch.tv/helix/users?login=${env.TWITCH_CHANNEL_LOGIN}`, {
headers: {
"client-id": env.TWITCH_CLIENT_ID,
"authorization": `Bearer ${t}`
}
})


const j = await r.json()
cache.user = j.data[0].id
return cache.user
}


async function clips(env, t, id) {
const r = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${id}&first=100`, {
headers: {
"client-id": env.TWITCH_CLIENT_ID,
"authorization": `Bearer ${t}`
}
})


const j = await r.json()


return j.data.map(c => ({
id: c.id,
title: c.title,
url: c.embed_url + "&parent=" + env.PARENT
}))
}


export default {
async fetch(req, env) {
env.PARENT = new URL(req.url).hostname


const t = await token(env)
const u = await userId(env, t)
const list = await clips(env, t, u)


list.sort(() => Math.random() - 0.5)


return new Response(JSON.stringify(list), {
headers: {
"content-type": "application/json",
"access-control-allow-origin": "*"
}
})
}
}