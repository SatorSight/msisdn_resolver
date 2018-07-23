const normalize_msisdn = msisdn => {
	if(msisdn.includes(' '))
		return msisdn.replace(' ', '+');
	return msisdn;
};

module.exports.normalize_msisdn = normalize_msisdn;