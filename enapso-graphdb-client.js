// Innotrade Enapso GraphDB Client Example
// (C) Copyright 2019 Innotrade GmbH, Herzogenrath, NRW, Germany
// Author: Alexander Schulze

// require the Enapso GraphDB Client package
const { EnapsoGraphDBClient } = require("enapso-graphdb-client");
const fs = require("fs");

// connection data to the running GraphDB instance
const
    GRAPHDB_BASE_URL = 'http://localhost:7200',
    GRAPHDB_REPOSITORY = 'dgc',
    GRAPHDB_USERNAME = 'oliverZ',
    GRAPHDB_PASSWORD = 'oliverZ',
    GRAPHDB_CONTEXT_TEST = 'http://example.org/dgc'
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
    //******************************************************************************************************/
    demoQuery: async function () {
        let query = await this.graphDBEndpoint.query(`
select * 
	from <${GRAPHDB_CONTEXT_TEST}>
where {
	?class rdf:type owl:Class
	filter(regex(str(?class), "http://ont.enapso.com/test#TestClass", "i")) .
}`
        );
        if (query.success) {
            let resp = await this.graphDBEndpoint.transformBindingsToResultSet(query);
            console.log("Query succeeded:\n" + JSON.stringify(resp, null, 2));
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
    /*******************************************************************************************************/
    demoInsert: async function (triple) {
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
    demoUpdate: async function () {
        let resp = await this.graphDBEndpoint.update(`
with <${GRAPHDB_CONTEXT_TEST}>
delete {
	entest:TestClass rdf:type owl:Class
}
insert {
	entest:TestClassUpdated rdf:type owl:Class
}
where {
	entest:TestClass rdf:type owl:Class
}`
        );
        console.log('Update ' +
            (resp.success ? 'succeeded' : 'failed') +
            ':\n' + JSON.stringify(resp, null, 2));
    },

    updateNodeDegree: async function (triple_old, triple_new) {
        let resp = await this.graphDBEndpoint.update(`
with <${GRAPHDB_CONTEXT_TEST}>
delete {` +
            triple_old +
            `}
insert {` +
            triple_new +
            `}
where {` +
            triple_old +
            `}`
        );
        console.log('Update ' +
            (resp.success ? 'succeeded' : 'failed') +
            ':\n' + JSON.stringify(resp, null, 2));
    },
    /******************************************************************************************************/
    demoDelete: async function () {
        let resp = await this.graphDBEndpoint.update(`
with <${GRAPHDB_CONTEXT_TEST}>
delete {
	?s ?p ?o
}
where {
	?s ?p ?o
}`
        );
        console.log('Delete ' +
            (resp.success ? 'succeeded' : 'failed') +
            ':\n' + JSON.stringify(resp, null, 2));
    },

    deleteWhere: async function (subject, predicate) {
        let resp = await this.graphDBEndpoint.update(`
with <${GRAPHDB_CONTEXT_TEST}>
delete 
{`+ subject + ` ` + predicate + ` ?o }
where 
{`+ subject + ` ` + predicate + ` ?o }`
        );
        console.log(subject);
        console.log('Delete ' +
            (resp.success ? 'succeeded' : 'failed') +
            ':\n' + JSON.stringify(resp, null, 2));
    },

    countAllArticles: async function () {
        let query = await this.graphDBEndpoint.query(`
select (COUNT(*) as ?sum)
	from <${GRAPHDB_CONTEXT_TEST}>
where {
	?s ?p ?o.
}`
        );
        if (query.success) {
            let resp = await this.graphDBEndpoint.transformBindingsToResultSet(query);
            console.log("Query succeeded:\n" + JSON.stringify(resp, null, 2));
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

    countArticlesWithEntity: async function (entity) {
        let query = await this.graphDBEndpoint.query(`
select (COUNT(?s) as ?sum)
	from <${GRAPHDB_CONTEXT_TEST}>
where {
	?s dgc:mentions ` + entity + `.
}`
        );
        if (query.success) {
            let resp = await this.graphDBEndpoint.transformBindingsToResultSet(query);
            console.log("Query succeeded:\n" + JSON.stringify(resp, null, 2));
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

    getUnclassifiedArticles: async function () {
        let query = await this.graphDBEndpoint.query(`
select ?article
	from <${GRAPHDB_CONTEXT_TEST}>
where {
	?article rdf:Type dgc:Article .
    FILTER (
        !EXISTS {
            ?article dgc:hasCategory ?o.
        }
    )
} limit 100`
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

    countAllArticles: async function () {
        let query = await this.graphDBEndpoint.query(`
select (COUNT(*) as ?sum)
	from <${GRAPHDB_CONTEXT_TEST}>
where {
	?s ?p ?o.
}`
        );
        if (query.success) {
            let resp = await this.graphDBEndpoint.transformBindingsToResultSet(query);
            console.log("Query succeeded:\n" + JSON.stringify(resp, null, 2));
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

    getAllNodes: async function () {
        console.log("Getting Nodes");
        let query = await this.graphDBEndpoint.query(`
select ?s ?o
	from <${GRAPHDB_CONTEXT_TEST}>
where {
	?s ?p ?o
}limit 10`
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

    getNodeDegree: async function () {
        let query = await this.graphDBEndpoint.query(`
select ?s ?o
	from <${GRAPHDB_CONTEXT_TEST}>
where { 
    ?s dgc:nodeDegree ?o.
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

    getEntitiesOfArticĺe: async function (article) {
        let query = await this.graphDBEndpoint.query(`
select ?p ?o
	from <${GRAPHDB_CONTEXT_TEST}>
where {`
            + article + `?p ?o.
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

    getSumOfArticlesInCategoryWithEntity: async function (entity, category) {
        let query = await this.graphDBEndpoint.query(`
select (count(?s) as ?sum)
	from <${GRAPHDB_CONTEXT_TEST}>
where {
    ? s dgc: mentions dgc: ` + entity + `.
    ? s dgc: hasCategory \"` + category + `\".
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
    demo: async function () {
        /*
                let prefixes = EnapsoGraphDBClient.parsePrefixes(sparql);
                console.log(JSON.stringify(prefixes, null, 2));
                return;
        */
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

        console.log('The initial repository should be empty:')
        await this.demoQuery();
        //await this.demoInsert(triple);

        console.log('The query should return one row with the new TestClass:')
        var res = await this.demoQuery();
        // if query successful, write csv to file
        /*if (res.success) {
            let csv = this.graphDBEndpoint.
                transformBindingsToCSV(res, {
                    delimiter: '"',
                    delimiterOptional: false
                });
            console.log("\CSV:\n" +
                JSON.stringify(csv, null, 2));
            fs.writeFileSync(
                'examples/example1.csv',
                // optionally add headers
                csv.headers.join('\r\n') + '\r\n' +
                // add the csv records to the file
                csv.records.join('\r\n'));
        }
        await this.demoUpdate();/*
        /*console.log('The query should return one row with TestClassUpdated:')
        res = await this.demoQuery();
        if (res.success) {
            let csv = this.graphDBEndpoint.
                transformBindingsToSeparatedValues(res, {
                    // replace IRIs by prefixes for easier 
                    // resultset readability (optional)
                    "replacePrefixes": true,
                    // drop the prefixes for easier 
                    // resultset readability (optional)
                    // "dropPrefixes": true,
                    "separator": ',',
                    "separatorEscape": '\\,',
                    "delimiter": '"',
                    "delimiterEscape": '\\"'
                }
                );
            fs.writeFileSync(
                'examples/example2.csv',
                // optionally add headers
                csv.headers.join('\r\n') + '\r\n' +
                // add the csv records to the file
                csv.records.join('\r\n'));
        }*/

        //DELETE WHOLE DATA IN GRAPH!!!
        //await this.demoDelete();

        //await this.demoQuery();
        //await this.countAllArticles()
        //await this.getAllNodes()
    }

}

console.log("Enapso GraphDB Client Demo");

(async () => {
    await EnapsoGraphDBClientDemo.demo();
})();