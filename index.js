require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
app.use(cors());

const serverPort = process.env.SERVER_PORT;
const bambooUrl = process.env.BAMBOO_API_URL;
const bambooToken = process.env.BAMBOO_TOKEN;

const axiosInstance = axios.create({
    headers: {
        'Authorization': 'Bearer ' + bambooToken
    }
});

/**
 * Gets c
 *
 * @param {string} plan_key The key for the bamboo build plan.
 * @param {string} environment_name The name of the deployment environment.
 * @param {number} max_results (Optional) The max number of results.
 * @param {number} start_index (Optional) The index of which result to start at.
 *
 * @return {JSON} Release info for the specified environment.
 */
app.get("/bamboo/environment-info/:plan_key/:environment_name",
    (req, res) => {
        const planKey = req.params.plan_key;
        const environmentName = req.params.environment_name;
        const maxResults = req.query.max_results;
        const startIndex = req.query.start_index;

        // Get related deployment plans for build key
        // e.g http://{YourHost}/rest/api/latest/deploy/project/forPlan?planKey=SH-SHB
        console.log(`Getting deployment projects for plan key: ${planKey}`);
        axiosInstance.get(bambooUrl + "deploy/project/forPlan/", {
            params: {
                planKey: planKey
            }
        }).then((response) => {
            console.log(`Got following deployment projects: ${JSON.stringify(response.data)}`);
            // Get environments
            // e.g http://{YourHost}/rest/api/latest/deploy/project/1015809
            axiosInstance.get(bambooUrl + "deploy/project/" + response.data[0].id)
                .then((response) => {
                    console.log(`Bamboo returned the following environments for plan key ${planKey}: ${JSON.stringify(response.data)}`);
                    let environment = response.data.environments.filter(env => env.name === environmentName);
                    if (Array.isArray(environment) && environment.length) {
                        console.log(`environment found: ${JSON.stringify(environment)}`);
                        let environmentId = environment[0].id;
                        const params = {
                            "max-results": maxResults,
                            "start-index": startIndex
                        }
                        console.log(`Get Environment information for environment ID: ${environmentId}`);
                        // Get deployments
                        // e.g http://{YourHost}/rest/api/latest/deploy/environment/1081347/results?max-results=1&start-index=0
                        axiosInstance.get(bambooUrl + "deploy/environment/" + environmentId + "/results", {
                            params
                        }).then((response) => {
                            res.send(response.data);
                        }).catch((error) => {
                            console.log(error);
                            res.sendStatus(500);
                        });
                    } else {
                        console.log(`Error no deployment plan found for [${environmentName}]!`);
                        res.sendStatus(404);
                    }
                }).catch((error) => {
                console.log(error);
                res.sendStatus(500);
            });
        }).catch((error) => {
            console.log(error);
            res.sendStatus(500);
        });
    });

app.listen(serverPort, () => {
    console.log("Bamboo service started on port: " + serverPort);
});
