const config = require('./config');
const rp = require('request-promise-native');
const queryString = require('query-string');
const normalizer = require('./normalize_msisdn')

const auth_post_fields = () => ({
	grant_type: config.GRANT_TYPE,
	client_id: config.CLIENT_ID,
	client_secret: config.CLIENT_SECRET,
});

const bridge_post_fields = (operator, msisdn, service_id) => ({
	serviceId: service_id,
	country: config.COUNTRY,
	operator: operator,
	userId: msisdn,
});

const auth_options = () => ({
	headers: {
		'Content-type': config.CONTENT_FORM_TYPE,
	},
    method: 'POST',
    uri: config.AUTH_URL,
    body: queryString.stringify(auth_post_fields()),
});

const bridge_options = (post_fields, access_token) => ({
	headers: {
		'Content-type': config.CONTENT_JSON_TYPE,
		'Authorization': 'Bearer ' + access_token,
	},
    method: 'POST',
    uri: config.SUBSCRIPTION_INFO_URL,
    body: JSON.stringify(post_fields),
});

const call_bridge = (token, msisdn, operator, service_id) => {
	const post_fields = bridge_post_fields(operator, msisdn, service_id);
	const bo = bridge_options(post_fields, token);
	return rp(bo);
};

const getSubscriptionInfo = (msisdn, service_id) => {
	return rp(auth_options())
		.then(r => {
			const resp = JSON.parse(r);
			const access_token = resp.access_token;
			return access_token;
		})
		.then(token => config.OPERATORS.map(operator => call_bridge(token, normalizer.normalize_msisdn(msisdn), operator, service_id)))
		.then(promises => Promise.all(promises).then(responses => responses))
		.then(promise_responses => reduceResponses(promise_responses));
};

const reduceResponses = responses => responses.reduce((accumulator, json_resp) => {
	const resp = JSON.parse(json_resp);
	if(parseInt(resp.status) === 1){
		accumulator.subscribed_for_any = true;
		if(accumulator.subscribed_operators.indexOf(resp.operator) === -1)
			accumulator.subscribed_operators.push(resp.operator);
	}
	return accumulator;
},{
	subscribed_for_any: false,
	subscribed_operators: [],
});

module.exports.getSubscriptionInfo = getSubscriptionInfo;