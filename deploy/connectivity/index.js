const express = require('express')
const connectivityRouter = express.Router()
const request = require('request')

const bodyParser = require('body-parser')
connectivityRouter.use(bodyParser.urlencoded({ extended: false }))
connectivityRouter.use(bodyParser.json())

const noCacheMiddleWare = (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache')
    next()
}

connectivityRouter.get('/connectivityMatrixData', noCacheMiddleWare, (req, res, next) => {
    getConnectedAreas(req.query.region)
        .then(res => JSON.parse(res))
        .then(json => Object.keys(json).map(key => {
                return {name: key, numberOfConnections: json[key]}
            })
            .filter(f => f.numberOfConnections > 0)
            .sort((a, b) => +b.numberOfConnections - +a.numberOfConnections)
            )
        .then(addColorToAreas => {
            const logMax = Math.log(addColorToAreas[0].numberOfConnections)
            addColorToAreas.forEach((a, i) => {
                addColorToAreas[i] = {
                    ...a,
                    color: {
                        r: colormap_red(Math.log(a.numberOfConnections) / logMax),
                        g: colormap_green(Math.log(a.numberOfConnections) / logMax),
                        b: colormap_blue(Math.log(a.numberOfConnections) / logMax)
                    }
                }
            })
            return addColorToAreas
        })
        .then(results => res.status(200).json(results))
        .catch(err =>  res.status(500).json(err))
})


const getConnectedAreas = (areaName) => {
    if (areaName.indexOf(' - right hemisphere') > -1 || areaName.indexOf(' - left hemisphere') > -1)
        areaName = areaName.replace(areaName.indexOf(' - left hemisphere') > -1 ? ' - left hemisphere' : ' - right hemisphere', '')

    return new Promise((resolve, reject) =>
        request.post({
            url: 'https://connectivityquery-connectivity.apps-dev.hbp.eu/connectivity',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({'area': `${areaName}`})
        },  (error, response, body) => {
            if (!error)
                resolve(body)
        })
    )
}

const clamp = val => Math.round(Math.max(0, Math.min(1.0, val)) * 255)

const colormap_red = (x ) => {
    if (x < 0.7) {
        return clamp(4.0 * x - 1.5);
    } else {
        return clamp(-4.0 * x + 4.5);
    }
}

const colormap_green = (x) => {
    if (x < 0.5) {
        return clamp(4.0 * x - 0.5);
    } else {
        return clamp(-4.0 * x + 3.5);
    }
}

const colormap_blue = (x) => {
    if (x < 0.3) {
        return clamp(4.0 * x + 0.5);
    } else {
        return clamp(-4.0 * x + 2.5);
    }
}


module.exports = connectivityRouter