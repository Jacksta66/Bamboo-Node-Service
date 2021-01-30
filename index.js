require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const serverPort = process.env.SERVER_PORT;
const bambooUrl = process.env.BAMBOO_API_URL;
const bambooToken = process.env.BAMBOO_TOKEN;

const axiosInstance = axios.create({
    headers: {'Authorization': 'Bearer ' + bambooToken}
});

// Get related deployment plans for build key
// e.g http://{YourHost}/rest/api/latest/deploy/project/forPlan?planKey=SH-SHB
app.get("/bamboo/deployment-plan/:plan_key", (req, res) => {
    const planKey = req.params.plan_key;
    axiosInstance.get(bambooUrl + "deploy/project/forPlan/", {
        params: {
            planKey: planKey
        }
    }).then(function(response) {
        res.send(response.data);
    }).catch(function(error) {
        console.log(error);
        res.send({})
    });
});

// Get environments
// e.g http://{YourHost}/rest/api/latest/deploy/project/1015809
app.get("/bamboo/environments/:deployment_id", (req, res) => {
    const deploymentId = req.params.deployment_id;
    axiosInstance.get(bambooUrl + "deploy/project/" + deploymentId)
        .then(function(response) {
        res.send(response.data);
    }).catch(function(error) {
        console.log(error);
        res.send({})
    });
});

// Get deployments (this endpoint needs auth with a user that has read access to the environment)
// e.g http://{YourHost}/rest/api/latest/deploy/environment/1081347/results?max-results=1&start-index=0
app.get("/bamboo/environment/:environment_id", (req, res) => {
    const environmentId = req.params.environment_id + "/";
    const maxResults = req.query.max_results;
    const startIndex = req.query.start_index;

    const params = {
        "max-results": maxResults,
        "start-index": startIndex
    }

    axiosInstance.get(bambooUrl + "deploy/environment/" + environmentId + "results", { params })
        .then(function(response) {
            res.send(response.data);
        }).catch(function(error) {
        console.log(error);
        res.send({})
    });
});

app.listen(serverPort, () => {
    console.log("Bamboo service started on port: " + serverPort);
});
