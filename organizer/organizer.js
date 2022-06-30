var esn = require('./esn_extract/esn_extract.js');
var metadata = require('./get_metadata/get_metadata.js');

module.exports.folder = async function (folder, type) {
	var tree = get_tree(folder,{})
	var library;
	switch (type) {
		case "show":
			library = gen_library_show(tree)
			library = await add_metada_show(library)
			break;
		case "movie":
			library = await gen_library_movie(tree)
			library = await add_metada_movie(library)
			break;
	}
	return library
}

async function add_metada_movie(library) {
	for (var entry in library) {
		library[entry].meta = {}
		for (var sub_entry in library[entry].content) {
			var meta = await metadata.get_movie(sub_entry)
			library[entry].meta[sub_entry] = meta.meta
		}
	}
	return library
}

async function gen_library_movie(tree) {
	var library = {}
	// Handle unclassified file
	library.other = {
		content: {}
	}
	for (var entry in tree) {
		if (typeof(tree[entry][Object.keys(tree[entry])[0]]) == "object") {
			// movies are inside a folder
			library[entry] = {
				content: {}
			}
			var candidates = await metadata.get_potential_movie(entry)
			for (sub_entry in tree[entry]) {
				var min = -1
				var id;
				for (var candidate in candidates.results) {
					var title = candidates.results[candidate].original_title
					var distance = sift3Distance(esn.clean(sub_entry), esn.clean(title))
					if (distance < min || min == -1) {
						min = distance
						id = candidates.results[candidate].id
					}
				}
				library[entry].content[id] = tree[entry][sub_entry][0]
			}
		} else {
			// Unclassified
			var name = tree[entry][0].split("/")
			name = name[name.length - 1]
			var ext = name.split(".")
			ext = ext[ext.length - 1]
			name = name.substring(0, name.length - ext.length - 1)
			var min = -1
			var id;
			var candidates = await metadata.get_potential_movie(name)
			for (var i = 0; i < name.split("-").length; i++) {
				if (candidates.results.length > 0) {
					break;
				}
				name = name.split("-")
				name.pop()
				name = name.join("-")
				candidates = await metadata.get_potential_movie(name)
			}
			for (var candidate in candidates.results) {
				var title = candidates.results[candidate].original_title
				var distance = sift3Distance(esn.clean(name), esn.clean(title))
				if (distance < min || min == -1) {
					min = distance
					id = candidates.results[candidate].id
				}
			}
			library.other.content[id] = tree[entry][0]
		}
	}
	return library
}

async function add_metada_show(library) {
	for (var entry in library) {
		var meta = await metadata.get_show(entry)
		library[entry].name = meta.name
		library[entry].thumb = meta.thumb
		library[entry].backdrop = meta.backdrop
		library[entry].overview = meta.overview
		library[entry].release = meta.release
		library[entry].meta = meta.meta
	}
	return library
}

function gen_library_show(tree) {
	var library = {}
	for (var entry in tree) {
		library[entry] = {
			content: {}
		}
		for (sub_entry in tree[entry]) {
			var details = esn.extract(sub_entry)
			if (typeof(tree[entry][sub_entry][Object.keys(tree[entry][sub_entry])[0]]) == "object") {
				// A season folder exists
				// In this case details.episode = season
				library[entry].content[details.episode] = {}
				for (var file in tree[entry][sub_entry]) {
					var file_details = esn.extract(file)
					library[entry].content[details.episode][file_details.episode] = tree[entry][sub_entry][file][0]
				}
			} else {
				// All season are merged in a single folder
				var file_details = esn.extract(sub_entry)
				if (!file_details.season) {
					// Empty folder
					continue
				}
				if (!library[entry].content.hasOwnProperty(file_details.season)) {
					library[entry].content[file_details.season] = {}
				}
				library[entry].content[file_details.season][file_details.episode] = tree[entry][sub_entry][0]
			}
		}
	}
	return library
}

function get_tree(folder) {
	var filesystem = require("fs");
	var results = []

    filesystem.readdirSync(folder).forEach(function(file) {
				if (file.substring(0,1) == ".") {
					// Skip hidden folder/files
					return
				}
        new_file = folder+'/'+file;
				filesystem.renameSync(new_file, folder+'/'+file.replace(/[ _]/g, '-'), function(e) {console.log(e)})
				new_file = new_file.replace(/[ _]/g, '-')
				file = file.replace(/[ _]/g, '-')
				results[file] = []
        var stat = filesystem.statSync(new_file);
        if (stat && stat.isDirectory()) {
						results[file] = get_tree(new_file)
        } else {
					results[file].push(new_file);
				}
    });

    return results
}

function sift3Distance(s1, s2) {
	if (s1 == null || s1.length === 0) {
		if (s2 == null || s2.length === 0) {
			return 0;
		} else {
			return s2.length;
		}
	}

	if (s2 == null || s2.length === 0) {
		return s1.length;
	}

	var c = 0;
	var offset1 = 0;
	var offset2 = 0;
	var lcs = 0;
	var maxOffset = 5;

	while ((c + offset1 < s1.length) && (c + offset2 < s2.length)) {
		if (s1.charAt(c + offset1) == s2.charAt(c + offset2)) {
			lcs++;
		} else {
			offset1 = 0;
			offset2 = 0;
			for (var i = 0; i < maxOffset; i++) {
				if ((c + i < s1.length) && (s1.charAt(c + i) == s2.charAt(c))) {
					offset1 = i;
					break;
				}
				if ((c + i < s2.length) && (s1.charAt(c) == s2.charAt(c + i))) {
					offset2 = i;
					break;
				}
			}
		}
		c++;
	}
	return (s1.length + s2.length) / 2 - lcs;
}
