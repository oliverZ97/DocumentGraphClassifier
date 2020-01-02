// Innotrade Enapso GraphDB Client Example
// (C) Copyright 2019 Innotrade GmbH, Herzogenrath, NRW, Germany
// Author: Alexander Schulze
// Source: https://github.com/innotrade/enapso-graphdb-client/blob/master/examples/examples.js

// require the Enapso GraphDB Client package
const { EnapsoGraphDBClient } = require("enapso-graphdb-client");

// connection data to the running GraphDB instance
const
    GRAPHDB_BASE_URL = 'http://localhost:7200',
    GRAPHDB_REPOSITORY = 'dgc',
    GRAPHDB_USERNAME = 'oliverZ',
    GRAPHDB_PASSWORD = 'oliverZ',
    GRAPHDB_CONTEXT_TEST = 'http://example.org/dgcX'
    ;

// the default prefixes for all SPARQL queries
const DEFAULT_PREFIXES = [
    EnapsoGraphDBClient.PREFIX_OWL,
    EnapsoGraphDBClient.PREFIX_RDF,
    EnapsoGraphDBClient.PREFIX_RDFS,
    EnapsoGraphDBClient.PREFIX_XSD,
    EnapsoGraphDBClient.PREFIX_PROTONS,
    EnapsoGraphDBClient.PREFIX_ENTEST,
    EnapsoGraphDBClient.PREFIX_DGC //added in NodeModules Enapso -> enapso-graphdb-client.js
];

const EnapsoGraphDBClientDemo = module.exports = {

    graphDBEndpoint: null,
    authentication: null,
    /*******************************************************************************************************/
    insertLocations: async function (locations) {
        let triples = ""
        locations.forEach(element => {
            let iriString = element.replace(/ /g, "_").replace(/[\'|\+|\’|\,|\(|\)|\/|\.|\"]/g, "-");
            let value = element;
            let triple_type = "dgc:" + iriString + " rdf:Type dgc:Location. \n"
            let triple_value = "dgc:" + iriString + " dgc:hasValue \"" + value + "\". \n"
            triples = triples + triple_type + triple_value;
        });
        let query = `
        insert data {
            graph <${GRAPHDB_CONTEXT_TEST}> {` +
            triples + `\n } }`
        let resp = await this.graphDBEndpoint.update(query);
        console.log(triples + " " +
            (resp.success ? 'succeeded' : 'failed') +
            ':\n' + JSON.stringify(resp, null, 2));
    },
    /******************************************************************************************************/
    insertPersons: async function (persons) {
        let triples = ""
        persons.forEach(element => {
            let iriString = element.replace(/ /g, "_").replace(/[\'|\+|\’|\,|\(|\)|\/|\.|\"]/g, "-");
            let value = element;
            let triple_type = "dgc:" + iriString + " rdf:Type dgc:Location. \n"
            let triple_value = "dgc:" + iriString + " dgc:hasValue \"" + value + "\". \n"
            triples = triples + triple_type + triple_value;
        });
        let query = `
        insert data {
            graph <${GRAPHDB_CONTEXT_TEST}> {` +
            triples + `\n } }`
        let resp = await this.graphDBEndpoint.update(query);
        console.log(triples + " " +
            (resp.success ? 'succeeded' : 'failed') +
            ':\n' + JSON.stringify(resp, null, 2));
    },
    /******************************************************************************************************/
    insertTriple: async function (triple) {
        let query = `
        insert data {
            graph <${GRAPHDB_CONTEXT_TEST}> {` +
            triple + `}}`
        let resp = await this.graphDBEndpoint.update(query);
        console.log(triple + " " +
            (resp.success ? 'succeeded' : 'failed') +
            ':\n' + JSON.stringify(resp, null, 2));
    },
    /******************************************************************************************************/
    getAllNodes: async function () {
        console.log("Getting Nodes");
        let query = await this.graphDBEndpoint.query(`
select ?s ?o
	from <${GRAPHDB_CONTEXT_TEST}>
where {
	?s ?p ?o
}`
        );
        if (query.success) {
            resp = await this.graphDBEndpoint.transformBindingsToResultSet(query);
            //csv = await this.graphDBEndpoint.transformBindingsToCSV(query);
            //console.log("Query succeeded:\n" + JSON.stringify(resp, null, 2));
        } else {
            let lMsg = query.message;
            if (400 === query.statusCode) {
                lMsg += ', check your query for potential errors';
            } else if (403 === query.statusCode) {
                lMsg += ', check if user "' + GRAPHDB_USERNAME +
                    '" has appropriate access rights to the Repository ' +
                    '"' + this.graphDBEndpoint.getRepository() + '"';
            }
            console.log("Query failed (" + lMsg + "):\n" +
                JSON.stringify(query, null, 2));
        }
        return query;
    },
    /******************************************************************************************************/
    getEntitiesOfArticĺeWithEntity: async function (entity) {
        //console.log("ENTITY OF QUERY ", entity)
        let query = await this.graphDBEndpoint.query(`
select *
	from <${GRAPHDB_CONTEXT_TEST}>
where { ?s dgc:mentions dgc:` + entity + `.
?s ?p ?o.
dgc:` + entity + ` dgc:inDegree ?inDegree.
dgc:` + entity + ` dgc:betweenessCentrality ?betweeness.
}`
        );
        if (query === null) {
            console.error("Query failed at Entity ", entity)
        }
        if (query.success) {
            resp = await this.graphDBEndpoint.transformBindingsToResultSet(query);
            //console.log("Query succeeded:\n" + JSON.stringify(resp, null, 2));
        } else {
            let lMsg = query.message;
            if (400 === query.statusCode) {
                lMsg += ', check your query for potential errors at entity ' + entity;
            } else if (403 === query.statusCode) {
                lMsg += ', check if user "' + GRAPHDB_USERNAME +
                    '" has appropriate access rights to the Repository ' +
                    '"' + this.graphDBEndpoint.getRepository() + '"';
            }
            console.log("Query failed (" + lMsg + "at Entity " + entity + "):\n" +
                JSON.stringify(query, null, 2));
        }
        return query;
    },
    /******************************************************************************************************/
    demo: async function () {
        //SET URL, REPO and PREFIXES for ENDPOINT
        this.graphDBEndpoint = new EnapsoGraphDBClient.Endpoint({
            baseURL: GRAPHDB_BASE_URL,
            repository: GRAPHDB_REPOSITORY,
            prefixes: DEFAULT_PREFIXES
        });

        //AUTHENTICATE with ENDPOINT
        this.authentication = await this.graphDBEndpoint.login(
            GRAPHDB_USERNAME,
            GRAPHDB_PASSWORD
        );

        //CHECK if AUTHENTICATION was successful
        if (!this.authentication.success) {
            let lMsg = this.authentication.message;
            if (500 === this.authentication.statusCode) {
                if ('ECONNREFUSED' === this.authentication.code) {
                    lMsg += ', check if GraphDB is running at ' +
                        this.graphDBEndpoint.getBaseURL();
                }
            } else if (401 === this.authentication.statusCode) {
                lMsg += ', check if user "' + GRAPHDB_USERNAME +
                    '" is set up in your GraphDB at ' +
                    this.graphDBEndpoint.getBaseURL();
            }
            console.log("Login failed: " + lMsg);
            return;
        }

        // verify authentication
        if (!this.authentication.success) {
            console.log("\nLogin failed:\n" +
                JSON.stringify(this.authentication, null, 2));
            return;
        }
        console.log("\nLogin successful"
            // + ':\n' + JSON.stringify(this.authentication, null, 2)
        );
    }
}

console.log("Enapso GraphDB Client Demo");

(async () => {
    await EnapsoGraphDBClientDemo.demo();
})();