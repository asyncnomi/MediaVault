module.exports.get_show = async function (str) {
    return await get_meta_show(str)
};

module.exports.get_movie = async function (str) {
    return await get_meta_movie(str)
};

module.exports.get_potential_movie = async function (str) {
    return await get_potential_movie(str)
};

const https = require('https');
const api_key = "TMDB v3 api key"

async function get_potential_movie(name) {
  let candidates = await request("https://api.themoviedb.org/3/search/movie?api_key="+api_key+"&query="+name)
  return candidates;
}

async function get_meta_movie(id) {
  let movie =  await request("https://api.themoviedb.org/3/movie/"+id+"?api_key="+api_key)
  return {
    meta: {
      thumb: "https://image.tmdb.org/t/p/w400"+movie.poster_path,
      backdrop: "https://image.tmdb.org/t/p/original"+movie.backdrop_path,
      release: movie.release_date,
      overview: movie.overview,
      name: movie.original_title,
      tagline: movie.tagline
    }
  }
}

async function get_meta_show(name) {
  // TMDB don't handle underscore in search request
  name = name.replace("_", "-")
	let details = await request("https://api.themoviedb.org/3/search/tv?api_key="+api_key+"&query="+name)
	if (details.results.length > 0) {
		let id = details.results[0].id
		let tv = await request("https://api.themoviedb.org/3/tv/"+id+"?api_key="+api_key)
    let meta = {}
    for (var i = 1; i <= tv.seasons.length; i++) {
      let season_content = await request("https://api.themoviedb.org/3/tv/"+id+"/season/"+i+"?api_key="+api_key)
      meta[i] = {
        release: season_content.air_date,
        overview: season_content.overview,
      }
      for (var episode in season_content.episodes) {
        meta[i][parseInt(episode)+1] = {
          name: season_content.episodes[episode].name,
          overview: season_content.episodes[episode].overview,
          thumb: "https://image.tmdb.org/t/p/w400"+season_content.episodes[episode].still_path
        }
      }
    }
		return {
      name: tv.name,
			thumb: "https://image.tmdb.org/t/p/w400"+tv.poster_path,
      backdrop: "https://image.tmdb.org/t/p/original"+tv.backdrop_path,
      overview: tv.overview,
      release: tv.first_air_date,
      meta: meta
		}
	}
}

function request(url) {
	return new Promise((resolve, reject) => {
		https.get(url, (resp) => {
		let data = '';

		resp.on('data', (chunk) => {
			data += chunk;
		});

		resp.on('end', () => {
			resolve(JSON.parse(data));
		});

		}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	})
}
