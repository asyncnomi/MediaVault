module.exports.extract = function (str) {
    return extract(str)
};

module.exports.clean = function (str) {
    return clean(str)
};

function extract(exp) {
	var RegExp = [/[sS]([0-9]+)[ ._x-]*[eE]([0-9]+)/g,
				        /[eE]([0-9]+)/g,
				        /([0-9]+)[ ._x-]+([0-9]+)/g,
				        /([0-9]+)/g]
	if (RegExp[0].test(exp)) {
		var res = exp.match(RegExp[0])[0]
		res = res.match(/([0-9]+)+/g)
		return {
			season: parseInt(res[0]),
			episode: parseInt(res[1])
		}
	}
	if (RegExp[1].test(exp)) {
		var res = exp.match(RegExp[1])[0]
		res = res.match(/([0-9]+)+/g)
		return {
			season: undefined,
			episode: parseInt(res[0])
		}
	}
	if (RegExp[2].test(exp)) {
		var res = exp.match(RegExp[2])[0]
		res = res.match(/([0-9]+)+/g)
		return {
			season: parseInt(res[0]),
			episode: parseInt(res[1])
		}
	}
	if (RegExp[3].test(exp)) {
		var res = exp.match(RegExp[3])[0]
		res = res.match(/([0-9]+)+/g)
		return {
			season: undefined,
			episode: parseInt(res[0])
		}
	}
	return -1
}

function clean(exp) {
  var res = exp
  res = res.replace(/[ _:,;'"{}|()\[\]]/g, "-")
  res = res.replace(/([-])\1+/g, "-")
  return res
}
