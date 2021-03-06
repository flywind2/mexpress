// Function definitions.
//
var addClinicalParameters = function() {
	var parametersList = $('.parameters-options');
	var clinicalParameters = $('#clinical-parameters').text();
	if (clinicalParameters === undefined || clinicalParameters === 'default') {
		clinicalParameters = cancerTypeAnnotation.default;
	} else if (clinicalParameters === '') {
		clinicalParameters = [];
	} else {
		clinicalParameters = clinicalParameters.split('+');
	}
	parametersList.empty();
	$.each(cancerTypeAnnotation.phenotype, function(index, value) {
		parametersList.append('<li data-value="' + value + '">' + value.replace(/_/g, ' ') +
			'</li>');
		if (clinicalParameters.indexOf(value) !== -1) {
			parametersList.find('li').last().addClass('selected');
		}
	});
};

var addCloseButton = function(x, y, svgClass) {
	// Draw a close button with the provided x, y coordinates as the center of the button.
	// Clicking the button will remove all SVG elements with the provided class, as well as the
	// button itself.
	var buttonSize = 6;
	svg.append('line')
		.attr('x1', x - buttonSize / 2)
		.attr('x2', x + buttonSize / 2)
		.attr('y1', y - buttonSize / 2)
		.attr('y2', y + buttonSize / 2)
		.attr('stroke-width', 1)
		.attr('stroke-linecap', 'round')
		.attr('stroke-linejoin', 'round')
		.attr('stroke', textColorBright)
		.attr('class', svgClass);
	svg.append('line')
		.attr('x1', x - buttonSize / 2)
		.attr('x2', x + buttonSize / 2)
		.attr('y1', y + buttonSize / 2)
		.attr('y2', y - buttonSize / 2)
		.attr('stroke-width', 1)
		.attr('stroke-linecap', 'round')
		.attr('stroke-linejoin', 'round')
		.attr('stroke', textColorBright)
		.attr('class', svgClass);
	svg.append('circle')
		.attr('cx', x)
		.attr('cy', y)
		.attr('fill-opacity', 0)
		.attr('r', buttonSize)
		.attr('class', svgClass + ' clickable')
		.on('mouseup', function() {
			$('.' + svgClass).remove();
			if (svgClass === 'probe-annotation') {
				var probePath = $('.highlighted');
				if (!probePath.hasClass('highlighted-promoter')) {
					$('.highlighted').css({'stroke': probeLineColor});
				}
				$('.highlighted').removeClass('highlighted');
			}
		});
};

var addProbeAnnotation = function(probeId, annotation, xPosition, yPosition) {
	svg.append('rect')
		.attr('fill', regionColor)
		.attr('x', xPosition - 5)
		.attr('y', yPosition)
		.attr('width', 160 - marginBetweenMainParts)
		.attr('height', 13 * (Object.keys(annotation).length + 2))
		.attr('class', 'probe-annotation');
	var counter = 1;
	svg.append('text')
			.attr('x', xPosition)
			.attr('y', yPosition + counter * 12) // the font size is 10px
			.attr('fill', textColorBright)
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'baseline')
			.attr('class', 'probe-annotation')
			.text('probe ID: ' + probeId);
	addCloseButton(xPosition + 130, yPosition + counter * 8, 'probe-annotation');
	$.each(annotation, function(key, value) {
		counter += 1;
		svg.append('text')
			.attr('x', xPosition)
			.attr('y', yPosition + counter * 12) // the font size is 10px
			.attr('fill', textColorBright)
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'baseline')
			.attr('class', 'probe-annotation')
			.text(key.replace(/_/g, ' ') + ': ' + value);
	});
	counter += 1;
	var probeStrand = annotation.strand === '+' ? 1 : -1;
	svg.append('a')
		.attr('xlink:href', 'https://rest.ensembl.org/sequence/region/human/' +
			annotation.chr + ':' + (annotation.cpg_location - 50) + '..' +
			(annotation.cpg_location + 50) + ':' + probeStrand +
			'?content-type=text/plain;coord_system_version=GRCh38')
		.attr('target', '_blank')
	.append('text')
		.attr('x', xPosition)
		.attr('y', yPosition + counter * 12) // the font size is 10px
		.attr('fill', textColorBright)
		.attr('text-decoration', 'underline')
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'baseline')
		.attr('class', 'probe-annotation')
		.text('link to sequence around CpG');
};

var addStatistic = function(statistic, x, y) {
	if (statistic) {
		statTextColor = statistic.p < 0.05 ? textColor : textColorLight;
		if ('r' in statistic) {
			statText = 'r = ' + statistic.r.toFixed(3);
			if (!isNaN(statistic.p)) {
				if (statistic.p < 0.001) {
					statText += '***';
				} else if (statistic.p < 0.01) {
					statText += '**';
				} else if (statistic.p < 0.05) {
					statText += '*';
				}
			} else {
				statText = 'NaN';
			}
		} else {
			if (!isNaN(statistic.p)) {
				if (statistic.p < 0.001) {
					statText = 'p = ' + statistic.p.toExponential(3);
				} else {
					statText = 'p = ' + statistic.p.toFixed(3);
				}
			} else {
				statText = 'NaN';
			}
		}
		svg.append('text')
			.attr('x', x)
			.attr('y', y + dataTrackHeight / 2)
			.attr('fill', statTextColor)
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'middle')
			.text(statText);
	}	
};

var addVariantAnnotation = function(annotation, xPosition, yPosition) {
	annotation = annotation.split('__');
	var maxTextWidth = 0;
	$.each(annotation, function(index, value) {
		if (value.length > 50) {
			value = value.substring(0, 50) + '...';
		}
		var textWidth = calculateTextWidth(value, '10px arial');
		maxTextWidth = textWidth > maxTextWidth ? textWidth : maxTextWidth;
	});
	svg.append('rect')
		.attr('fill', regionColor)
		.attr('x', xPosition + 5)
		.attr('y', yPosition)
		.attr('width', maxTextWidth + 2 * 5) // 2 * 5 = margin around text
		.attr('height', 13 * annotation.length)
		.attr('class', 'variant-annotation');
	var counter = 0;
	addCloseButton(xPosition + maxTextWidth + 5, yPosition + 8, 'variant-annotation');
	$.each(annotation, function(index, value) {
		counter += 1;
		var annotationText;
		if (value.startsWith('sample:')) {
			// We don't want to replace the underscores in the sample names.
			annotationText = value;
		} else {
			annotationText = value.replace(/_/g, ' ');
		}
		if (annotationText.length > 50) {
			annotationText = annotationText.substring(0, 50) + '...';
		}
		svg.append('text')
			.attr('x', xPosition + 10)
			.attr('y', yPosition + counter * 12) // the font size is 10px
			.attr('fill', textColorBright)
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'baseline')
			.attr('class', 'variant-annotation')
			.text(annotationText);
	});
};

var addToolbar = function() {
	// Reset the toolbar.
	$('.toolbar .data-summary').empty()
		.append('<p><strong>' + cancerTypeDataFiltered.region_annotation.name + '</strong> &mdash; ' +
			cancerTypeAnnotation.full_name + '</p>')
		.append('<p>Showing data for <span class="nr_samples"></span> samples.</p>');
	$('.toolbar--select-sorter option:not(:first)').remove();
	$('.toolbar--select-filter option:not(:first)').remove();
	$('.toolbar--select-data-type option[value=cnv]').attr('disabled', false);

	// Add the available variables to the 'sorter' select dropdown. Here, the user can choose to
	// reorder the samples by any of the available variables.
	$('.toolbar--select-filter').append('<option value="region_expression">expression</option>');
	if (cancerTypeDataFiltered.cnv) {
		$('.toolbar--select-filter').append('<option value="cnv">copy number</option>');
		$('.toolbar--select-sorter').append('<option value="cnv">copy number</option>');
	} else {
		$('.toolbar--select-data-type option[value=cnv]').attr('disabled', true);
	}
	$('.toolbar--select-filter').append('<option value="dna_methylation_data">DNA methylation</option>');
	var clinicalParameters = $('#clinical-parameters').text();
	if (clinicalParameters === undefined || clinicalParameters === 'default') {
		clinicalParameters = cancerTypeAnnotation.default;
	} else if (clinicalParameters === '') {
		clinicalParameters = [];
	} else {
		clinicalParameters = clinicalParameters.split('+');
	}
	$.each(clinicalParameters, function(index, value) {
		var parameterText = value.replace(/_/g, ' ');
		if (parameterText.length > 35) {
			parameterText = parameterText.substr(0, 32) + '...';
		}
		$('.toolbar--select-filter').append('<option value="' + value + '" data-type="clinical">' +
			parameterText + '</option>');
		$('.toolbar--select-sorter').append('<option value="' + value + '" data-type="clinical">' +
			parameterText + '</option>');
	});
	var sampleSorter = $('#sample-sorter').text();
	sampleSorter = sampleSorter === '' ? 'region_expression' : sampleSorter;
	$('.toolbar--select-sorter option[value="' + sampleSorter + '"]').prop('selected', true);
	$('.toolbar__cover').fadeOut(500);
};

var calculateStatistics = function(samples, sorter) {
	var result = {};
	var sorterValues = [];
	var dataValues;
	$.each(samples, function(index, sample) {
		var sorterValue;
		if (sorter in cancerTypeDataFiltered.phenotype) {
			sorterValue = cancerTypeDataFiltered.phenotype[sorter][sample];
		} else {
			sorterValue = cancerTypeDataFiltered[sorter][sample];
		}
		if (sorterValue !== null && sorterValue !== undefined) {
			sorterValues.push(sorterValue);
		} else {
			sorterValues.push(null);
		}
	});
	var sorterValuesNumeric = parameterIsNumerical(sorterValues);
	var sorterCategories = [];
	if (sorterValuesNumeric) {
		sorterValues = sorterValues.map(makeNumeric);
	} else {
		sorterCategories = Object.values(sorterValues).filter(uniqueValues);
		sorterCategories = sorterCategories.filter(function(x) {
			return x !== null;
		});
	}

	// DNA methylation data.
	result.dna_methylation_data = {};
	$.each(cancerTypeDataFiltered.dna_methylation_data, function(key, value) {
		dataValues = [];
		$.each(samples, function(index, sample) {
			var dataValue = value[sample];
			if (dataValue !== null) {
				dataValues.push(+dataValue);
			} else {
				dataValues.push(null);
			}
		});
		if (sorterValuesNumeric) {
			// Sorter = numeric & data = numeric
			// ==> correlation
			result.dna_methylation_data[key] = pearsonCorrelation(sorterValues, dataValues);
		} else {
			if (sorterCategories.length === 2) {
				// Sorter = two categories & data = numeric
				// ==> t test
				var valuesGroup1 = dataValues.filter(function(x, index) {
					return sorterValues[index] === sorterCategories[0];
				});
				var valuesGroup2 = dataValues.filter(function(x, index) {
					return sorterValues[index] === sorterCategories[1];
				});
				result.dna_methylation_data[key] = {'p': tTest(valuesGroup1, valuesGroup2)};
			} else if (sorterCategories.length > 2) {
				// Sorter = more than two categories & data = numeric
				// ==> ANOVA
				var valuesGroups = [];
				for (var i=0; i < sorterCategories.length; i++) {
					var groupValues = dataValues.filter(function(x, index) {
						return sorterValues[index] === sorterCategories[i];
					});
					valuesGroups.push(groupValues);
				}
				result.dna_methylation_data[key] = {'p': anova(valuesGroups)};
			} else {
				result.dna_methylation_data[key] = null;
			}
		}
	});

	// Phenotype data.
	result.phenotype = {};
	$.each(cancerTypeDataFiltered.phenotype, function(key, value) {
		var valuesGroups, valuesGroup1, valuesGroup2, i;
		if (sorter !== key) {
			dataValues = [];
			$.each(samples, function(index, sample) {
				var dataValue = value[sample];
				if (dataValue !== null) {
					dataValues.push(dataValue);
				} else {
					dataValues.push(null);
				}
			});
			if (parameterIsNumerical(dataValues)) {
				dataValues = dataValues.map(makeNumeric);
				if (sorterValuesNumeric) {
					// Sorter = numeric & data = numeric
					// ==> correlation
					result.phenotype[key] = pearsonCorrelation(sorterValues, dataValues);
				} else if (sorterCategories.length === 2) {
					// Sorter = two categories & data = numeric
					// ==> t test
					valuesGroup1 = dataValues.filter(function(x, index) {
						return sorterValues[index] === sorterCategories[0];
					});
					valuesGroup2 = dataValues.filter(function(x, index) {
						return sorterValues[index] === sorterCategories[1];
					});
					result.phenotype[key] = {'p': tTest(valuesGroup1, valuesGroup2)};
				} else if (sorterCategories.length > 2) {
					// Sorter = more than two categories & data = numeric
					// ==> ANOVA
					valuesGroups = [];
					for (i=0; i < sorterCategories.length; i++) {
						var groupValues = dataValues.filter(function(x, index) {
							return sorterValues[index] === sorterCategories[i];
						});
						valuesGroups.push(groupValues);
					}
					result.phenotype[key] = {'p': anova(valuesGroups)};
				} else {
					result.phenotype[key] = null;
				}
			} else {
				var dataCategories = Object.values(dataValues).filter(uniqueValues);
				dataCategories = dataCategories.filter(function(x) {
					return x !== null;
				});
				if (sorterValuesNumeric) {
					if (dataCategories.length === 2) {
						// Sorter = numeric & data = two categories
						// ==> t test
						valuesGroup1 = sorterValues.filter(function(x, index) {
							return dataValues[index] === dataCategories[0];
						});
						valuesGroup2 = sorterValues.filter(function(x, index) {
							return dataValues[index] === dataCategories[1];
						});
						result.phenotype[key] = {'p': tTest(valuesGroup1, valuesGroup2)};
					} else if (dataCategories.length > 2) {
						// Sorter = numeric & data = more than two categories
						// ==> ANOVA
						valuesGroups = [];
						for (i=0; i < dataCategories.length; i++) {
							var groupValues = sorterValues.filter(function(x, index) {
								return dataValues[index] === dataCategories[i];
							});
							valuesGroups.push(groupValues);
						}
						result.phenotype[key] = {'p': anova(valuesGroups)};
					} else {
						result.phenotype[key] = null;
					}
				} else {
					// Sorter = categorical & data = categorical
					// => chi square test
					var counts = [];
					for (i = 0; i < sorterCategories.length; i++) {
						var row = [];
						for (j = 0; j < dataCategories.length; j++) {
							var count = 0;
							$.each(samples, function(index, sample) {
								var sorterValue = cancerTypeDataFiltered.phenotype[sorter][sample];
								var dataValue = value[sample];
								if (sorterValue === sorterCategories[i] && dataValue === dataCategories[j]) {
									count++;
								}
							});
							row.push(count);
						}
						counts.push(row);
					}
					result.phenotype[key] = {'p': chiSquare(counts)};
				}
			}
		}
	});

	// Region expression data.
	if (sorter !== 'region_expression') {
		dataValues = [];
		$.each(samples, function(index, sample) {
			var dataValue = cancerTypeDataFiltered.region_expression[sample];
			if (dataValue !== null) {
				dataValues.push(+dataValue);
			} else {
				dataValues.push(null);
			}
		});
		if (sorterValuesNumeric) {
			// Sorter = numeric & data = numeric
			// ==> correlation
			result.region_expression = pearsonCorrelation(sorterValues, dataValues);
		} else if (sorterCategories.length === 2) {
			// Sorter = two categories & data = numeric
			// ==> t test
			valuesGroup1 = dataValues.filter(function(x, index) {
				return sorterValues[index] === sorterCategories[0];
			});
			valuesGroup2 = dataValues.filter(function(x, index) {
				return sorterValues[index] === sorterCategories[1];
			});
			result.region_expression = {'p': tTest(valuesGroup1, valuesGroup2)};
		} else if (sorterCategories.length > 2) {
			// Sorter = more than two categories & data = numeric
			// ==> ANOVA
			valuesGroups = [];
			for (i=0; i < sorterCategories.length; i++) {
				var groupValues = dataValues.filter(function(x, index) {
					return sorterValues[index] === sorterCategories[i];
				});
				valuesGroups.push(groupValues);
			}
			result.region_expression = {'p': anova(valuesGroups)};
		} else {
			result.region_expression = null;
		}
	} else {
		result.region_expression = null;
	}

	// Copy number data.
	if (sorter !== 'cnv' && cancerTypeDataFiltered.cnv) {
		dataValues = [];
		$.each(samples, function(index, sample) {
			var dataValue = cancerTypeDataFiltered.cnv[sample];
			if (dataValue !== null) {
				dataValues.push(+dataValue);
			} else {
				dataValues.push(null);
			}
		});
		if (sorterValuesNumeric) {
			// Sorter = numeric & data = numeric
			// ==> correlation
			result.cnv = pearsonCorrelation(sorterValues, dataValues);
		} else if (sorterCategories.length === 2) {
			// Sorter = two categories & data = numeric
			// ==> t test
			valuesGroup1 = dataValues.filter(function(x, index) {
				return sorterValues[index] === sorterCategories[0];
			});
			valuesGroup2 = dataValues.filter(function(x, index) {
				return sorterValues[index] === sorterCategories[1];
			});
			result.cnv = {'p': tTest(valuesGroup1, valuesGroup2)};
		} else if (sorterCategories.length > 2) {
			// Sorter = more than two categories & data = numeric
			// ==> ANOVA
			valuesGroups = [];
			for (i=0; i < sorterCategories.length; i++) {
				var groupValues = dataValues.filter(function(x, index) {
					return sorterValues[index] === sorterCategories[i];
				});
				valuesGroups.push(groupValues);
			}
			result.cnv = {'p': anova(valuesGroups)};
		} else {
			result.cnv = null;
		}
	} else {
		result.cnv = null;
	}
	result.sorter = sorter;
	return result;
};

var calculateTextWidth = function(text, font) {
	// This function was adapted from https://stackoverflow.com/a/21015393
	var canvas = calculateTextWidth.canvas ? calculateTextWidth.canvas :
		document.createElement('canvas');
	var context = canvas.getContext('2d');
	context.font = font;
	var textWidth = Math.ceil(context.measureText(text).width);
	return textWidth;
};

var cleanString = function(s) {
	s = s.replace(/[^\w-]/g, '');
	return s;
};

var clearFilterSelection = function() {
	var filterParent = $('.select-filter');
	$('.filter-options-container').empty().text(' . . . ');
	$('.filter-value-container').empty().text(' . . . ');
	filterParent.find('input[type=text]').remove();
	filterParent.find('.data-summary').empty();
	$('.filter-options').remove();
	$('.button--filter').addClass('button--inactive');
};

var cleanUpImages = function(file) {
	$.ajax({
		type: 'POST',
		url: 'php/cleanUpImages.php',
		data: {file: file},
	}).done(function(reply) {
		reply = $.parseJSON(reply);
		if (!reply.success) {
			console.log('Could not delete the images.');
		}
	});
};

var drawArrow = function(y, xPosition, annotation, color) {
	// Add an arrow to indicate whether the region is located on the + or - strand.
	svg.append('path')
		.attr('d', function() {
			var pathX, pathY;
			pathX = xPosition;
			if (annotation.strand === '+') {
				pathY = y(annotation.end);
				return 'M ' + pathX + ' ' + pathY + 'l 0 -10 l -3 0 z';
			} else if (annotation.strand === '-') {
				pathY = y(annotation.start);
				return 'M ' + pathX + ' ' + pathY + 'l 0 10 l -3 0 z';
			}
		})
		.attr('fill', color);
};

var drawHorizontalArrow = function(x, yPosition, annotation, color) {
	// Add an arrow to indicate whether the region is located on the + or - strand.
	svg.append('path')
		.attr('d', function() {
			var pathX, pathY;
			pathY = yPosition;
			if (annotation.strand === '+') {
				pathX = x(annotation.end);
				return 'M ' + pathX + ' ' + pathY + 'l -10 0 l 0 -3 z';
			} else if (annotation.strand === '-') {
				pathX = x(annotation.start);
				return 'M ' + pathX + ' ' + pathY + 'l 10 0 l 0 -3 z';
			}
		})
		.attr('fill', color);
};

var drawBarPlot = function(data, element) {
	// Calculate the data necessary to create a bar plot.
	var uniqueDataValues = data.filter(uniqueValues);
	uniqueDataValues.sort(sortAlphabetically);
	var dataTable = {};
	var maxTextWidth = 0;
	$.each(uniqueDataValues, function(index, value) {
		var count = data.filter(function(x) {
			return x === value;
		}).length;
		dataTable[value] = count;
		var plotText = value + ' (' + dataTable[value] + '/' + data.length + ')';
		var valueTextWidth = calculateTextWidth(plotText, '11px arial');
		if (valueTextWidth > maxTextWidth) {
			maxTextWidth = valueTextWidth;
		}
	});
	var barPlotWidth = 100;
	var barPlotHeight = dataTrackHeight * uniqueDataValues.length;
	var margin = {top: 5, left: 10 + maxTextWidth, bottom: 5, right: 5};
	var x = d3.scaleLinear().domain([0, data.length]).range([0, barPlotWidth]);
	var y = d3.scaleLinear().domain([0, uniqueDataValues.length])
		.range([0, barPlotHeight]);
	var barPlotSvg = d3.select(element)
		.append('svg')
			.attr('width', barPlotWidth + margin.left + margin.right)
			.attr('height', barPlotHeight + margin.top + margin.bottom)
		.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
	$.each(uniqueDataValues, function(index, value) {
		var valueClass = value ? value : 'null';
		valueClass = valueClass.replace(/ /g, '_') + '-bar';
		valueClass = valueClass.replace(/[;()'/]/g, '');
		barPlotSvg.append('rect')
			.attr('class', valueClass)
			.attr('x', 0)
			.attr('y', y(index))
			.attr('width', x(dataTable[value]))
			.attr('height', dataTrackHeight)
			.attr('fill', histogramColor);
		barPlotSvg.append('text')
			.attr('class', valueClass)
			.attr('x', -5)
			.attr('y', y(index) + dataTrackHeight / 2)
			.attr('font-size', '11px')
			.attr('fill', histogramColor)
			.attr('text-anchor', 'end')
			.attr('alignment-baseline', 'middle')
			.text(value + ' (' + dataTable[value] + '/' + data.length + ')');
	});
};

var drawCoordinates = function(axis, horizontal, height) {
	var coordinates = [];
	var plotWindow = cancerTypeDataFiltered.plot_data.end - cancerTypeDataFiltered.plot_data.start;
	var factor = 1000;
	if (plotWindow <= 10000 && plotWindow > 1000) {
		factor = 100;
	} else if (plotWindow <= 1000 && plotWindow > 100) {
		factor = 10;
	} else if (plotWindow <= 100) {
		factor = 1;
	}
	coordinates.push(Math.ceil(cancerTypeDataFiltered.plot_data.start / factor) * factor);
	coordinates.push(Math.floor(cancerTypeDataFiltered.plot_data.end / factor) * factor);
	coordinates.push(coordinates[0] + Math.round(Math.abs(coordinates[0] - coordinates[1]) /
		(2 * factor)) * factor);
	if (horizontal) {
		$.each(coordinates, function(index, value) {
			svg.append('text')
				.attr('x', axis(value))
				.attr('y', height)
				.attr('text-anchor', 'middle')
				.attr('alignment-baseline', 'baseline')
				.text(value);
			svg.append('line')
				.attr('x1', axis(value))
				.attr('x2', axis(value))
				.attr('y1', height - genomicCoordinatesHeight - genomicFeatureLargeMargin)
				.attr('y2', height - 2 * genomicCoordinatesHeight - genomicFeatureLargeMargin)
				.attr('stroke', textColor);
		});
	} else {
		$.each(coordinates, function(index, value) {
			svg.append('text')
				.attr('x', 0)
				.attr('y', axis(value))
				.attr('text-anchor', 'middle')
				.attr('alignment-baseline', 'baseline')
				.attr('transform', 'rotate(-90, ' + 0 + ',' + axis(value) + ')')
				.text(value);
			svg.append('line')
				.attr('x1', genomicFeatureLargeMargin)
				.attr('x2', genomicFeatureLargeMargin + genomicCoordinatesWidth)
				.attr('y1', axis(value))
				.attr('y2', axis(value))
				.attr('stroke', textColor);
		});
	}
};

var drawDataTrack = function(data, sortedSamples, allSamples, color, xPosition, yPosition, variable) {
	var dataValues = [];
	$.each(sortedSamples, function(index, sample) {
		if (sample in data) {
			dataValues.push(data[sample]);
		} else {
			dataValues.push(null);
		}
	});
	
	// If all the values are null, we can just draw a single rectangle instead of an separate
	// missing value rectangle for each sample. This will reduce the number of DOM elements, which
	// in turn will help reduce the "lagginess" that can appear when a lot of data has to be
	// plotted.
	var allNull = dataValues.every(function(x) {
		return x === null;
	});
	if (allNull) {
		svg.append('rect')
			.attr('fill', missingValueColor)
			.attr('x', xPosition)
			.attr('y', yPosition)
			.attr('width', sortedSamples.length * sampleWidth)
			.attr('height', dataTrackHeight);
	} else if (parameterIsNumerical(dataValues)) {
		dataValues = dataValues.map(makeNumeric);
		var factor = maximum(dataValues) / dataTrackHeight;
		if (variable === 'methylation') {
			factor = 1 / dataTrackHeight;
		}
		if (factor === 0) {
			factor = 1;
		}
		$.each(dataValues, function(index, value) {
			var rectHeight, rectCol;
			if (value !== null) {
				rectHeight = value / factor;
				rectCol = color;
			} else {
				rectHeight = dataTrackHeight;
				rectCol = missingValueColor;
			}
			svg.append('rect')
				.attr('fill', rectCol)
				.attr('x', xPosition + sampleWidth * index)
				.attr('y', yPosition + dataTrackHeight - rectHeight)
				.attr('width', sampleWidth)
				.attr('height', rectHeight);
		});
	} else {
		// We want to map each categorical variable value to a specific color. When the user
		// filters the data, these color assignments should remain the same (e.g. if gender "male"
		// is blue in the default plot, it should remain blue after the user filters out female
		// patients).
		var unfilteredData;
		if (variable in cancerTypeData) {
			unfilteredData = cancerTypeData[variable];
		} else if (variable in cancerTypeData.phenotype) {
			unfilteredData = cancerTypeData.phenotype[variable];
		}
		var unfilteredDataValues = [];
		$.each(allSamples, function(index, sample) {
			if (sample in unfilteredData) {
				unfilteredDataValues.push(unfilteredData[sample]);
			} else {
				unfilteredDataValues.push(null);
			}
		});
		var allCategories = Object.values(unfilteredData).filter(uniqueValues);
		allCategories.sort(sortAlphabetically);
		var re = new RegExp('^(clinical|pathologic)_|tumor_stage_*|clinical_stage_');
		var categoryColors;
		if (re.test(variable)) {
			categoryColors = allCategories.map(function(x) {
				if (x) {
					if (allCategories.length <= stageColorsSimplified.length) {
						return stageColorsSimplified[allCategories.indexOf(x)];
					} else {
						return stageColors[allCategories.indexOf(x)];
					}
				} else {
					return missingValueColor;
				}
			});
		} else {
			categoryColors = allCategories.map(function(x) {
				if (x) {
					if (variable === 'sample_type') {
						if (x in sampleTypeColors) {
							return sampleTypeColors[x];
						} else {
							return missingValueColor;
						}
					} else {
						return categoricalColors[allCategories.indexOf(x)];
					}
				} else {
					return missingValueColor;
				}
			});
		}
		$.each(dataValues, function(index, value) {
			var colorIndex = allCategories.indexOf(value);
			svg.append('rect')
				.attr('fill', categoryColors[colorIndex])
				.attr('x', xPosition + sampleWidth * index)
				.attr('y', yPosition)
				.attr('width', sampleWidth)
				.attr('height', dataTrackHeight);
		});
	}
	if (variable !== 'methylation') {
		var parameterText = variable.replace(/_/g, ' ');
		if (parameterText.length > 35) {
			parameterText = parameterText.substr(0, 32) + '...';
		}
		svg.append('text')
			.attr('x', xPosition - marginBetweenMainParts / 2)
			.attr('y', yPosition + dataTrackHeight / 2)
			.attr('text-anchor', 'end')
			.attr('alignment-baseline', 'middle')
			.text(parameterText);
	}
};

var drawDataTrackCopyNumber = function(data, sortedSamples, xPosition, yPosition) {
	var dataValues = [];
	$.each(sortedSamples, function(index, sample) {
		if (sample in data) {
			dataValues.push(data[sample]);
		} else {
			dataValues.push(null);
		}
	});
	var cnvFactor = 4 / dataTrackHeight; // The copy number values range from -2 to 2.

	// Draw a horizontal line at 0. This will make it easier to see the difference between positive
	// and negative copy numbers, especially when there are a lot of zeros.
	svg.append('line')
		.attr('x1', xPosition)
		.attr('x2', xPosition + sortedSamples.length * sampleWidth)
		.attr('y1', yPosition + dataTrackHeight / 2)
		.attr('y2', yPosition + dataTrackHeight / 2)
		.attr('stroke', otherRegionColor)
		.attr('stroke-width', 1);
	$.each(dataValues, function(index, value) {
		var rectHeight, rectCol, yPositionRect;
		yPositionRect = yPosition;
		if (value !== null) {
			rectHeight = Math.abs(value / cnvFactor);
			if (value < 0) {
				yPositionRect += dataTrackHeight / 2;
				rectCol = otherRegionColor;
			} else {
				yPositionRect += dataTrackHeight / 2 - rectHeight;
				rectCol = regionColor;
			}
		} else {
			rectHeight = dataTrackHeight;
			rectCol = missingValueColor;
			yPositionRect += dataTrackHeight - rectHeight;
		}
		svg.append('rect')
			.attr('fill', rectCol)
			.attr('x', xPosition + sampleWidth * index)
			.attr('y', yPositionRect)
			.attr('width', sampleWidth)
			.attr('height', rectHeight);
	});
	svg.append('text')
		.attr('x', xPosition - marginBetweenMainParts / 2)
		.attr('y', yPosition + dataTrackHeight / 2)
		.attr('text-anchor', 'end')
		.attr('alignment-baseline', 'middle')
		.text('copy number');
};

var drawDataTrackVariants = function(data, sortedSamples, variantPosition, xPosition, yPosition) {
	var dataValues = [];
	$.each(sortedSamples, function(index, sample) {
		var sampleVariant = [];
		$.each(data, function(index, snv) {
			if (snv.sample === sample) {
				sampleVariant.push(snv);
			}
		});
		if (sampleVariant.length) {
			dataValues.push(sampleVariant[0]);
		} else {
			dataValues.push(null);
		}
	});
	var variantCategories = getVariantCategories(cancerTypeDataFiltered.snv);
	var variantColors = dataValues.map(function(x) {
		if (x) {
			return categoricalColors[variantCategories.indexOf(x.effect)];
		} else {
			return missingValueColor;
		}
	});
	$.each(dataValues, function(index, value) {
		if (value !== null) {
			var variantAnnotation = '';
			$.each(value, function(k, v) {
				variantAnnotation += k + ': ' + v + '__';
			});
			variantAnnotation = variantAnnotation.slice(0, -2); // Remove trailing '__'.
			svg.append('circle')
				.attr('cx', xPosition + sampleWidth * index)
				.attr('cy', yPosition + 2)
				.attr('r', 2)
				.attr('fill', variantColors[index])
				.attr('id', variantAnnotation)
				.attr('class', 'clickable')
				.on('mouseup', function() {
					$('.variant-annotation').remove();
					if ($(this).hasClass('highlighted')) {
						$(this).removeClass('highlighted');
					} else {
						$('.highlighted').removeClass('highlighted');
						var annotation = $(this).attr('id');
						var xPosition = Number($(this).attr('cx')) + 10;
						var yPosition = Number($(this).attr('cy'));
						$(this).addClass('highlighted');
						addVariantAnnotation(variantAnnotation, xPosition, yPosition);
					}
				});
		}
	});
};

var drawHistogram = function(data, element) {
	// Calculate the data necessary to plot a histogram.
	var dataSummary = summary(data, true);
	var histogramData = [dataSummary.minimum];
	var histogramDataStep = (dataSummary.maximum - dataSummary.minimum) / 10;
	var histogramDataCounts = [];
	for (var i=1; i<10; i++) {
		var nextStep = histogramData[i-1] + histogramDataStep;
		histogramData.push(nextStep);
		histogramDataCounts.push(data.filter(function(x) {
			return x >= histogramData[i - 1] && x < histogramData[i];
		}).length);
	}

	// We still need to add the maximum.
	histogramData.push(dataSummary.maximum);
	histogramDataCounts.push(data.filter(function(x) {
		return x >= histogramData[histogramData.length - 2] &&
			x <= histogramData[histogramData.length - 1];
	}).length ); // Note that this last check tests whether a value is smaller OR EQUAL TO the
				 // upper limit. Otherwise we would fail to count the values that are equal to
				 // the maximum.
	var x = d3.scaleLinear().domain([0, histogramDataCounts.length]).range([0, 100]);
	var y = d3.scaleLinear().domain([0, maximum(histogramDataCounts)])
		.range([0, 80]);
	var histogramSvg = d3.select(element)
		.append('svg')
			.attr('width', 110)
			.attr('height', 90)
		.append('g')
			.attr('transform', 'translate(5,5)');
	$.each(histogramDataCounts, function(index, value) {
		histogramSvg.append('rect')
			.attr('fill', histogramColor)
			.attr('x', index * 10)
			.attr('y', 80 - y(value))
			.attr('width', 10)
			.attr('height', y(value));
	});

	// Add vertical lines for the summary values. We will hide them by setting the opacity to 0, so
	// that they can be shown when the user hovers the related value in the data summary list.
	$.each(dataSummary, function(key, value) {
		if (key !== 'null') {
			var xPositionLine =  (value - dataSummary.minimum) /
				((dataSummary.maximum - dataSummary.minimum) / 10);
			var lineClass = key.replace(/%/, '');
			lineClass = lineClass.replace(/ /g, '-');
			histogramSvg.append('line')
				.attr('x1', x(xPositionLine))
				.attr('x2', x(xPositionLine))
				.attr('y1', 0)
				.attr('y2', 90)
				.attr('class', lineClass + '-line')
				.style('stroke', histogramColorFocus)
				.style('stroke-opacity', 0)
				.attr('stroke-width', 2);
		}
	});
};

var filterSamples = function(sampleFilter, allSamples) {
	if (sampleFilter === null || sampleFilter === '') {
		return allSamples;
	} else {
		sampleFilters = sampleFilter.split('___');
		var filteredSamples = allSamples;
		$.each(sampleFilters, function(index, value) {
			var filter = value.split('__');
			var parameterToFilter = filter[0];
			var filterCommand = filter[1];
			var filterValues = filter[2].split('+');
			var dataToFilter;
			if (parameterToFilter in cancerTypeDataFiltered) {
				dataToFilter = cancerTypeDataFiltered[parameterToFilter];
			} else if (parameterToFilter in cancerTypeDataFiltered.phenotype) {
				dataToFilter = cancerTypeDataFiltered.phenotype[parameterToFilter];
			} else {
				console.log('ERROR: cannot find "' + parameterToFilter + '" in the data object keys.');
				return false;
			}
			if (parameterToFilter === 'dna_methylation_data') {
				filteredSamples = filteredSamples.filter(function(sample) {
					var nullCount = 0;
					$.each(dataToFilter, function(key, value) {
						if (sample in value) {
							if (value[sample] === null) {
								nullCount++;
							}
						} else {
							nullCount++;
						}
					});
					return nullCount < Object.keys(dataToFilter).length;
				});
			} else {
				filteredSamples = filteredSamples.filter(function(sample) {
					var filterResult = 0;
					$.each(filterValues, function(index, value) {
						if (value !== 'null') {
							if (isNumber(value)) {
								if (filterCommand === 'lt') {
									filterResult += dataToFilter[sample] < +value;
								} else if (filterCommand === 'le') {
									filterResult += dataToFilter[sample] <= +value;
								} else if (filterCommand === 'eq') {
									filterResult += dataToFilter[sample] == +value;
								} else if (filterCommand === 'ne') {
									filterResult += dataToFilter[sample] != +value;
								} else if (filterCommand === 'ge') {
									filterResult += dataToFilter[sample] >= +value;
								} else if (filterCommand === 'gt') {
									filterResult += dataToFilter[sample] > +value;
								}
							} else {
								if (filterCommand === 'eq') {
									filterResult += dataToFilter[sample] == value;
								} else if (filterCommand === 'ne') {
									filterResult += dataToFilter[sample] != value;
								}
							}
						} else if (value === 'null') {
							if (filterCommand === 'eq') {
								filterResult += dataToFilter[sample] === null ||
									dataToFilter[sample] === undefined;
							} else if (filterCommand === 'ne') {
								filterResult += dataToFilter[sample] !== null &&
									dataToFilter[sample] !== undefined;
							}
						}
					});
					if (filterCommand === 'ne') {
						// The 'not equal to' case is special, because it represents a logical 'AND',
						// meaning that all checks need to be true before we can add a sample to our list
						// of filtered samples.
						return filterResult === filterValues.length;
					} else {
						return filterResult;
					}
					return filterResult;
				});
			}
		});
		return filteredSamples;
	}
};

var getVariantCategories = function(data) {
	var categories = [];
	$.each(data, function(sample, snv) {
		$.each(snv, function(index, value) {
			if (categories.indexOf(value.effect) === -1) {
				categories.push(value.effect);
			}
		});
	});
	categories.sort(sortAlphabetically);
	return categories;
};

var hideWindow = function(elementClass) {
	$(elementClass).slideUp(200);
};

var isRegion = function(type) {
	return function(x) {
		return x.region_type === type;
	};
};

var loadData = function(name, cancer) {
	$.ajax({
		type: 'POST',
		url: 'php/loadData.php',
		data: {name: name, cancer: cancer}
	}).done(function(reply) {
		$('.button--plot .loader').hide();
		$('.button--plot').removeClass('button--inactive');
		$('.button__text').css('visibility', 'visible');
		cancerTypeData = $.parseJSON(reply);
		if (cancerTypeData.success) {
			// By default, the samples are not filtered and are sorted by the expression of the
			// selected main region.
			plot('region_expression', null, false);
		} else {
			$('.svg-container > svg').remove();
			var errorElement = '<p>' + cancerTypeData.msg + '</p>';
			$('.message--error').append(errorElement).show();
		}
	});
};

var merge = function() {
	// This function was slightly adapted from: https://codegolf.stackexchange.com/a/17129
	var args = arguments;
	var hash = {};
	var result = [];
	for (var i = 0; i < args.length; i++) {
		for (var j = 0; j < args[i].length; j++) {
			if (hash[args[i][j]] !== true) {
				result[result.length] = args[i][j];
				hash[args[i][j]] = true;
			}
		}
	}
	return result;
};

var parameterIsNumerical = function(x) {
	return x.every(isNumber);
};

var plot = function(sorter, sampleFilter, showVariants, plotStart, plotEnd) {
	$('.svg-container > svg').remove();

	// Make a hard copy of the cancerTypeData object. We want to avoid toucing the original data as
	// much as possible and will almost exclusively work with the copy.
	cancerTypeDataFiltered = $.extend(true, {}, cancerTypeData);
	addToolbar();
	addClinicalParameters();

	// The plot consists of three main parts:
	// 1. genomic annotation data (miRNAs, genes, transcripts, CpG islands)
	// 2. location-linked data (DNA methylation and somatic mutations)
	// 3. sample-linked data (expression, copy number variation, clinical data)
	// In order to draw an accurate plot we need to count:
	// - the number of samples
	// - the number of genomic features/regions
	// -=> will determine the width of the plot
	// - the number of clinical parameters
	// - the number of location-linked data tracks
	// -=> will determine the height of the plot
	//
	// Count the number of samples.
	var dnaMethylationSamples = 0;
	if (cancerTypeDataFiltered.dna_methylation_data.length) {
		var dnaMethProbe = Object.keys(cancerTypeDataFiltered.dna_methylation_data)[0];
		dnaMethylationSamples = Object.keys(cancerTypeDataFiltered.dna_methylation_data[dnaMethProbe]);
	}
	var regionExpressionSamples = Object.keys(cancerTypeDataFiltered.region_expression);
	var phenotypeVariable = Object.keys(cancerTypeDataFiltered.phenotype)[0];
	var phenotypeSamples = Object.keys(cancerTypeDataFiltered.phenotype[phenotypeVariable]);
	var cnvSamples = 0;
	if (cancerTypeDataFiltered.cnv) {
		cnvSamples = Object.keys(cancerTypeDataFiltered.cnv);
	}

	// Create an array that holds all the samples for which there is any type of data. This array
	// will be used to sort the samples by whichever variable the user chooses. It will also be
	// used to filter the data (e.g. to show only primary tumor samples).
	var allSamples = merge(dnaMethylationSamples, regionExpressionSamples, phenotypeSamples,
		cnvSamples);

	// Filter the samples. By default, there is no filtering applied.
	var samples = filterSamples(sampleFilter, allSamples);
	var removedSamples = allSamples.filter(function(x) {
		return samples.indexOf(x) === -1;
	});

	// Sort the samples by the selected variable.
	var dataToSort;
	if (!sorter) {
		sorter = 'region_expression';
	}
	if (sorter in cancerTypeDataFiltered) {
		dataToSort = cancerTypeDataFiltered[sorter];
		samples = sortSamples(samples, dataToSort);
	} else if (sorter in cancerTypeDataFiltered.phenotype) {
		dataToSort = cancerTypeDataFiltered.phenotype[sorter];
		samples = sortSamples(samples, dataToSort);
	}
	cancerTypeDataFiltered.samples_filtered_sorted = samples;

	// Filter the data based on the list of filtered and sorted samples.
	$.each(removedSamples, function(index, sample) {
		$.each(Object.keys(cancerTypeDataFiltered.dna_methylation_data), function(index, probe) {
			delete cancerTypeDataFiltered.dna_methylation_data[probe][sample];
		});
		$.each(Object.keys(cancerTypeDataFiltered.phenotype), function(index, value) {
			delete cancerTypeDataFiltered.phenotype[value][sample];
		});
		delete cancerTypeDataFiltered.snv[sample];
		delete cancerTypeDataFiltered.region_expression[sample];
		if (cancerTypeDataFiltered.cnv) {
			delete cancerTypeDataFiltered.cnv[sample];
		}
	});
	//console.log('cancerTypeDataFiltered');
	//console.log(cancerTypeDataFiltered);

	// Count the number of regions (including transcripts in the case of genes) that need to be
	// drawn.
	var nrOtherGenes = cancerTypeDataFiltered.other_regions.filter(isRegion('gene')).length;
	var nrTranscripts = 0;
	if (cancerTypeDataFiltered.region_annotation.region_type === 'gene') {
		nrTranscripts = Object.keys(cancerTypeDataFiltered.region_annotation.transcripts).length;
	}
	var nrOtherTranscripts = 0;
	$.each(cancerTypeDataFiltered.other_regions.filter(isRegion('gene')), function(key, value) {
		nrOtherTranscripts += Object.keys(value.transcripts).length;
	});
	var nrOtherMirnas = cancerTypeDataFiltered.other_regions.filter(isRegion('mirna')).length;
	//console.log('# transcripts = ' + nrTranscripts);
	//console.log('# other genes = ' + nrOtherGenes);
	//console.log('# other transcripts = ' + nrOtherTranscripts);
	//console.log('# other miRNAs = ' + nrOtherMirnas);
	var genomicFeaturesWidth = genomicFeatureLargeMargin +
							   genomicCoordinatesWidth +
							   genomicFeatureSmallMargin +
							   cpgWidth +
							   genomicFeatureSmallMargin +
							   cpgIslandWidth +
							   genomicFeatureLargeMargin +
							   regionWidth +
							   genomicFeatureSmallMargin +
							   nrTranscripts * transcriptWidth +
							   (nrTranscripts - 1) * genomicFeatureSmallMargin +
							   genomicFeatureLargeMargin +
							   nrOtherGenes * regionWidth +
							   (nrOtherGenes - 1) * genomicFeatureSmallMargin +
							   genomicFeatureLargeMargin +
							   nrOtherTranscripts * transcriptWidth +
							   (nrOtherTranscripts - 1) * genomicFeatureSmallMargin +
							   genomicFeatureLargeMargin +
							   nrOtherMirnas * regionWidth +
							   (nrOtherMirnas - 1) * genomicFeatureLargeMargin +
							   genomicFeatureLargeMargin;

	// Count the number of phenotype parameters that need to be plotted. We need to count the
	// default parameters in the cancerTypeAnnotation object, not all the parameters in the data
	// object.
	var clinicalParameters = $('#clinical-parameters').text();
	var nrClinicalParameters = 0;
	if (clinicalParameters === undefined || clinicalParameters === 'default') {
		clinicalParameters = cancerTypeAnnotation.default;
	} else if (clinicalParameters === '') {
		clinicalParameters = [];
	} else {
		clinicalParameters = clinicalParameters.split('+');
	}
	nrClinicalParameters += clinicalParameters.length;
	var clinicalParametersHeight = nrClinicalParameters * (dataTrackHeight + dataTrackSeparator);

	// Calculate the width and height of the legend. This legend needs to contain all the
	// categorical clinical parameters as well as the genomic variant categories (if they
	// need to be shown) and the copy number data annotation.
	var categoricalClinicalParameters = clinicalParameters.filter(function(a) {
		return !parameterIsNumerical(Object.values(cancerTypeDataFiltered.phenotype[a]));
	});
	var legendHeight = 0;
	legendHeight = dataTrackHeight + // Space for the legend title.
		categoricalClinicalParameters.length * (dataTrackHeight + dataTrackSeparator);
	if (cancerTypeDataFiltered.cnv) {
		// Add an extra track for the copy number data.
		legendHeight += dataTrackHeight + dataTrackSeparator;
	}
	var legendWidth = 0;
	$.each(categoricalClinicalParameters, function(index, value) {
		var categoryData = cancerTypeDataFiltered.phenotype[value];
		var categoryDataValues = [];
		$.each(Object.keys(categoryData), function(index, sample) {
			if (cancerTypeDataFiltered.samples_filtered_sorted.indexOf(sample) > -1) {
				categoryDataValues.push(categoryData[sample]);
			}
		});
		var categories = categoryDataValues.filter(uniqueValues);
		var categoryWidth = 0;
		$.each(categories, function(i, v) {
			v = v ? v : 'null';
			var textWidth = calculateTextWidth(v.replace(/_/g, ' '), '10px arial');
			categoryWidth += textWidth + 2 * legendRectWidth + 5;
		});
		if (categoryWidth > legendWidth) {
			legendWidth = categoryWidth;
		}
	});
	var variantCategories;
	if (showVariants) {
		legendHeight += dataTrackHeight + dataTrackSeparator;
		variantCategories = getVariantCategories(cancerTypeDataFiltered.snv);
		var variantCategoriesWidth = 0;
		$.each(variantCategories, function(i, v) {
			v = v ? v : 'null';
			var textWidth = calculateTextWidth(v.replace(/_/g, ' '), '10px arial');
			variantCategoriesWidth += textWidth + 2 * legendRectWidth + 5;
		});
		if (variantCategoriesWidth > legendWidth) {
			legendWidth = variantCategoriesWidth;
		}
	}
	var cnvCategories = ['-2: homozygous deletion', '-1: single copy deletion',
		'0: diploid normal', '+1: low-level amplification', '+2: high-level amplification'];
	var cnvCategoriesWidth = 0;
	$.each(cnvCategories, function(i, v) {
		var textWidth = calculateTextWidth(v.replace(/_/g, ' '), '10px arial');
		cnvCategoriesWidth += textWidth + 5 * sampleWidth + 5;
	});
	if (cnvCategoriesWidth > legendWidth) {
		legendWidth = cnvCategoriesWidth;
	}
	var addStats = true;
	if (addStats) {
		legendHeight += dataTrackHeight + dataTrackSeparator;
	}

	// Count the number of location-linked data tracks that need to be plotted. These include the
	// tracks for the DNA methylation data (one track per probe), as well as the variant data (one
	// track per variant).
	var nrDnaMethylationTracks = 0;
	var nrVariantTracks = 0;
	var variants = showVariants ? variantsByStartValue(cancerTypeDataFiltered.snv) : {};
	var filteredVariants = variants;
	if (plotStart && plotEnd) {
		// Filter the DNA methylation probes and somatic mutations based on the provided genomic
		// window.
		cancerTypeDataFiltered.plot_data.start = plotStart;
		cancerTypeDataFiltered.plot_data.end = plotEnd;
		var filteredDnaMethylationData = {};
		var filteredProbeAnnotation = {};
		$.each(cancerTypeDataFiltered.dna_methylation_data, function(probe, data) {
			var probeLocation = cancerTypeDataFiltered.probe_annotation[probe].cpg_location;
			if (probeLocation >= plotStart && probeLocation <= plotEnd) {
				filteredDnaMethylationData[probe] = data;
				filteredProbeAnnotation[probe] = cancerTypeDataFiltered.probe_annotation[probe];
			}
		});
		nrDnaMethylationTracks = Object.keys(filteredDnaMethylationData).length;
		cancerTypeDataFiltered.probe_annotation = filteredProbeAnnotation;
		cancerTypeDataFiltered.dna_methylation_data = filteredDnaMethylationData;
		filteredVariants = {};
		$.each(variants, function(location, data) {
			var snv = [];
			$.each(data, function(i, a) {
				if (location >= plotStart && location <= plotEnd) {
					snv.push(a);
				}
			});
			if (snv.length > 0) {
				filteredVariants[location] = snv;
			}
		});
		nrVariantTracks = Object.keys(filteredVariants).length;
		cancerTypeDataFiltered.snv = filteredVariants;
	} else {
		nrDnaMethylationTracks = Object.keys(cancerTypeDataFiltered.dna_methylation_data).length;
		nrVariantTracks = Object.keys(variants).length;
	}

	// Calculate the amount of vertical space that is needed to plot all the data tracks. All the
	// phenotype and expression data will be plotted in the top margin. This way we can have the y
	// axis represent genomic coordinates and we don't have to worry about mapping the phenotype
	// and expression tracks to a genomic location.
	var topMargin = legendHeight +
					marginBetweenMainParts * 3 + // Margin between the legend and the data tracks.
					clinicalParametersHeight +
					marginBetweenMainParts + // Margin between the phenotype and expression data.
					dataTrackHeight + // Extra space for the gene/miRNA expression data.
					dataTrackSeparator +
					dataTrackHeight; // Extra space for the copy number variation data.
	if (showVariants) {
		topMargin += dataTrackHeight + dataTrackSeparator;
	}
	var locationLinkedTracksHeight = nrDnaMethylationTracks * dataTrackHeight +
									 nrDnaMethylationTracks * dataTrackSeparator +
									 nrVariantTracks * dataTrackHeightVariants +
									 nrVariantTracks * dataTrackSeparator +
									 marginBetweenMainParts;
	if (locationLinkedTracksHeight < 400) {
		locationLinkedTracksHeight = 400;
	}

	// Calculate the necessary statistics (correlation, t-test, ANOVA) for the sorter. If for
	// example the samples are sorted by their region expression, then all statistics will be
	// calculated based on the expression data, i.e. correlation between expression and DNA
	// methylation, correlation between expression and numerical clinical parameters, t-test or
	// ANOVA comparing expression in different groups for categorical clinical parameters.
	stats = calculateStatistics(samples, sorter);
	//console.log('stats');
	//console.log(stats);

	// Adjust the p values for multiple hypothesis testing.
	stats = pAdjust(stats);

	// Calculate the amount of horizontal space that is needed to plot the genomic annotation and
	// all the samples (or the legend, depending on the widest one).
	var samplesWidth = samples.length * sampleWidth;
	if (samplesWidth < legendWidth) {
		samplesWidth = legendWidth;
	}
	var width = genomicFeaturesWidth +
				marginBetweenMainParts * 5 + // Leave enough space to draw the lines that connect
											 // the probe locations with the DNA methylation data.
				samplesWidth;

	// Add the number of samples to the toolbar.
	$('.nr_samples').text(samples.length);

	// Build the SVG.
	var margin = {top: 20 + topMargin, left: 50, bottom: 200, right: 200};
	var x = d3.scaleLinear().domain([0, width]).range([0, width]);
	var y = d3.scaleLinear().domain([cancerTypeDataFiltered.plot_data.start, cancerTypeDataFiltered.plot_data.end])
		.range([0, locationLinkedTracksHeight]);
	svg = d3.select('.svg-container')
		.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', locationLinkedTracksHeight + margin.top + margin.bottom)
			.attr('text-rendering', 'optimizeLegibility')
			.attr('font-family', 'arial')
			.attr('font-size', '10px')
			.attr('fill', textColor)
			.on('mousemove', function() {
				var xPosition = d3.mouse(this)[0] - margin.left;
				var yPosition = d3.mouse(this)[1] - margin.top;
				if (xPosition > 0 && xPosition < genomicFeaturesWidth && yPosition > 0 && yPosition < locationLinkedTracksHeight) {
					$(this).css('cursor', 'crosshair');
				} else {
					$(this).css('cursor', 'default');
				}
			})
			.on('mousedown', function() {
				function mousemove(el, y) {
					$('.zoom-rect').remove();
					var newYPos = d3.mouse(el.node())[1] - margin.top;

					// Limit the size of the zoom rectangle to the plot window.
					if (newYPos < 0) {
						newYPos = 0;
					}
					if (newYPos > locationLinkedTracksHeight) {
						newYPos = locationLinkedTracksHeight;
					}
					if (newYPos < y) {
						// We can't draw rectangles with a negative height, so when the new y
						// position is lower than the start position (when the user draws a
						// rectangle up from where they first clicked) we have to flip both
						// variables.
						var tmp = y;
						y = newYPos;
						newYPos = tmp;
					}
					var rectWidth = genomicFeaturesWidth + marginBetweenMainParts;
					var rectHeight = newYPos - y;
					svg.append('rect')
						.attr('x', genomicCoordinatesWidth)
						.attr('y', y)
						.attr('width', rectWidth)
						.attr('height', rectHeight)
						.attr('class', 'zoom-rect')
						.attr('fill', transcriptColor)
						.attr('fill-opacity', 0.25)
						.attr('stroke-width', '1px')
						.attr('stroke', regionColor);
				}
				function mouseup() {
					var rect = $('.zoom-rect').first();
					rect.remove();
					w.on('mousemove', null).on('mouseup', null);

					// Use the coordinates of the zoom rectangle to zoom in on part of the plot.
					var rectY = +rect.attr('y');
					var rectHeight = +rect.attr('height');
					if (rectHeight > 0) {
						var newStart = Math.round(y.invert(rectY));
						var newEnd = Math.round(y.invert(rectY + rectHeight));

						// Recreate the plot.
						var sampleSorter = $('#sample-sorter').text();
						sampleSorter = sampleSorter === '' ? 'region_expression' : sampleSorter;
						var sampleFilter = $('#sample-filter').text();
						sampleFilter = sampleFilter === '' ? null : sampleFilter;
						var showVariants = $('.toolbar--check-variants').prop('checked');
						$('.plot-loader.overlay').fadeOut(200, function() {
							$('.plot-loader').show();
							$('.button--zoom-out').removeClass('button--inactive');
							setTimeout(function() {
								plot(sampleSorter, sampleFilter, showVariants, newStart, newEnd);
							}, 100);
						});
					}
				}
				var coord = d3.mouse(this);
				if (coord[0] > margin.left && coord[0] < margin.left + genomicFeaturesWidth +
					marginBetweenMainParts * 5 && coord[1] > margin.top && coord[1] < margin.top +
					locationLinkedTracksHeight) {
					// The user clicked inside the plot window (we're excluding the margins!).
					d3.event.preventDefault();
					var el = d3.select(this);
					var startY = coord[1] - margin.top;
					var w = d3.select(window)
						.on('mousemove', function() {
							mousemove(el, startY);
						})
						.on('mouseup', mouseup);
				}
			})
		.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	// Add a white background to the SVG.
	svg.append('rect')
		.attr('x', -margin.left)
		.attr('y', -margin.top)
		.attr('width', width + margin.left + margin.right)
		.attr('height', locationLinkedTracksHeight + margin.top + margin.bottom)
		.attr('fill', '#fff');

	// Draw the lines that connect the genomic locations of the Infinium probes with their
	// corresponding DNA methylation data tracks.
	var xPosition = genomicFeatureLargeMargin +
					genomicCoordinatesWidth +
					genomicFeatureSmallMargin;
	var probeCounter = 0;
	var probeLocations = [];
	var promoterStart, promoterEnd;
	if (cancerTypeDataFiltered.region_annotation.strand === '+') {
		promoterStart = cancerTypeDataFiltered.region_annotation.start - 1000;
		promoterEnd = cancerTypeDataFiltered.region_annotation.start + 500;
	} else {
		promoterStart = cancerTypeDataFiltered.region_annotation.end - 500;
		promoterEnd = cancerTypeDataFiltered.region_annotation.end + 1000;
	}
	$.each(cancerTypeDataFiltered.probe_annotation, function(key, value) {
		var yPosition = value.cpg_location;
		probeLocations.push(yPosition);
		var probeClass = 'not-promoter';
		if (yPosition >= promoterStart && yPosition <= promoterEnd) {
			probeClass = 'promoter';
		}
		var nrVariants = 0;
		if (showVariants) {
			// We need to leave enough room to plot the somatic mutations.
			nrVariants = Object.keys(filteredVariants).filter(function(x) {
				return x < yPosition;
			}).length;
		}
		var yPositionDataTrack = marginBetweenMainParts +
								 probeCounter * (dataTrackHeight + dataTrackSeparator) +
								 nrVariants * (dataTrackHeightVariants + dataTrackSeparator) +
								 dataTrackHeight / 2;
		if (yPosition < cancerTypeDataFiltered.plot_data.end && yPosition > cancerTypeDataFiltered.plot_data.start) {
			// Draw the horizontal part of the line.
			svg.append('line')
				.attr('x1', xPosition)
				.attr('x2', genomicFeaturesWidth)
				.attr('y1', y(yPosition))
				.attr('y2', y(yPosition))
				.attr('class', key + ' ' + probeClass)
				.attr('stroke', probeLineColor)
				.attr('stroke-width', 1);

			// Draw the sloped line that connects the DNA methylation data track with the probe
			// location.
			svg.append('line')
				.attr('x1', genomicFeaturesWidth)
				.attr('x2', genomicFeaturesWidth + marginBetweenMainParts * 5)
				.attr('y1', y(yPosition))
				.attr('y2', yPositionDataTrack)
				.attr('class', key + ' ' + probeClass)
				.attr('stroke', probeLineColor)
				.attr('stroke-width', 1);
			probeCounter += 1;
		}
	});

	// Draw the lines that connect the genomic locations of the somatic mutations with their
	// corresponding data tracks.
	var variantCounter = 0;
	if (showVariants) {
		$.each(filteredVariants, function(position, snv) {
			var nrProbes = probeLocations.filter(function(x) {
				return x < position;
			}).length;
			var yPositionDataTrack = marginBetweenMainParts +
									 variantCounter * (dataTrackHeightVariants + dataTrackSeparator) +
									 nrProbes * (dataTrackHeight + dataTrackSeparator) +
									 dataTrackHeightVariants / 2;
			if (position < cancerTypeDataFiltered.plot_data.end && position > cancerTypeDataFiltered.plot_data.start) {
				// Draw the horizontal part of the line.
				svg.append('line')
					.attr('x1', xPosition)
					.attr('x2', genomicFeaturesWidth)
					.attr('y1', y(position))
					.attr('y2', y(position))
					.attr('class', 'variant-line-' + position)
					.style('stroke', probeLineColor)
					.attr('stroke-width', 1);

				// Draw the sloped line that connects the genomic variant data track with the
				// location of the variant.
				svg.append('line')
					.attr('x1', genomicFeaturesWidth)
					.attr('x2', genomicFeaturesWidth + marginBetweenMainParts * 5)
					.attr('y1', y(position))
					.attr('y2', yPositionDataTrack)
					.attr('class', 'variant-line-' + position)
					.attr('stroke', probeLineColor)
					.attr('stroke-width', 1);

				// Add an extra horizontal line to visually separate the different somatic mutations.
				svg.append('line')
					.attr('x1', genomicFeaturesWidth + marginBetweenMainParts * 5)
					.attr('x2', genomicFeaturesWidth + marginBetweenMainParts * 5 +
						genomicFeatureLargeMargin + sampleWidth * samples.length)
					.attr('y1', yPositionDataTrack)
					.attr('y2', yPositionDataTrack)
					.attr('class', 'variant-line-' + position)
					.style('stroke', probeLineColor)
					.attr('stroke-width', 1)
					.on('mouseover', function() {
						var variantClass = $(this).attr('class');
						$('.' + variantClass).css({'stroke': textColor});
					})
					.on('mouseout', function() {
						var variantClass = $(this).attr('class');
						$('.' + variantClass).css({'stroke': probeLineColor});
					});
				variantCounter += 1;
			}
		});
	}

	// Add the genomic coordinates (= y axis).
	drawCoordinates(y, false);

	// Draw the individual CpGs and the CpG islands.
	// Adapt the opacity of the CpG lines to the length of the plot window. Otherwise the CpG plot
	// is just one big block of green for long genes (and large plot windows). For really long
	// genes (length > 200kb), we will simply not draw the individual CpGs. They become one big
	// green blob anyway.
	// Start by adding a small legend below the genome annotation that explains the different
	// parts.
	var genomeLegendDistanceFactor = 3;
	svg.append('line')
		.attr('x1', xPosition)
		.attr('y1', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.attr('x2', xPosition + 100)
		.attr('y2', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.attr('class', 'legend-separator')
		.attr('stroke', textColorLight);
	genomeLegendDistanceFactor += 2;
	svg.append('line')
		.attr('x1', xPosition)
		.attr('x2', xPosition + cpgWidth)
		.attr('y1', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.attr('y2', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.style('stroke', cpgColor)
		.attr('stroke-width', sampleWidth);
	svg.append('text')
		.attr('x', xPosition + cpgWidth + genomicFeatureLargeMargin)
		.attr('y', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.attr('fill', textColor)
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'middle')
		.text('CpG dinucleotide');
	genomeLegendDistanceFactor += 1;
	svg.append('line')
		.attr('x1', xPosition)
		.attr('x2', xPosition + cpgWidth)
		.attr('y1', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.attr('y2', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.style('stroke', cpgColor)
		.attr('stroke-width', cpgIslandWidth);
	svg.append('text')
		.attr('x', xPosition + cpgWidth + genomicFeatureLargeMargin)
		.attr('y', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.attr('fill', textColor)
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'middle')
		.text('CpG island');
	genomeLegendDistanceFactor += 1;
	svg.append('line')
		.attr('x1', xPosition)
		.attr('x2', xPosition + cpgWidth)
		.attr('y1', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.attr('y2', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.style('stroke', regionColor)
		.attr('stroke-width', regionWidth);
	svg.append('text')
		.attr('x', xPosition + cpgWidth + genomicFeatureLargeMargin)
		.attr('y', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.attr('fill', textColor)
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'middle')
		.text(cancerTypeDataFiltered.region_annotation.region_type);
	genomeLegendDistanceFactor += 1;
	svg.append('line')
		.attr('x1', xPosition)
		.attr('x2', xPosition + cpgWidth)
		.attr('y1', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.attr('y2', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.style('stroke', transcriptColor)
		.attr('stroke-width', transcriptWidth);
	svg.append('text')
		.attr('x', xPosition + cpgWidth + genomicFeatureLargeMargin)
		.attr('y', locationLinkedTracksHeight + dataTrackHeight * genomeLegendDistanceFactor)
		.attr('fill', textColor)
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'middle')
		.text('transcript');
	var plotWindowLength = Math.abs(cancerTypeDataFiltered.plot_data.start -
		cancerTypeDataFiltered.plot_data.end);
	var cpgOpacity = 1;
	if (plotWindowLength < 200000) {
		cpgOpacity = 1 - plotWindowLength / 200000;
		$.each(cancerTypeDataFiltered.region_annotation.cpg_locations, function(index, value) {
			if (value > cancerTypeDataFiltered.plot_data.start && value < cancerTypeDataFiltered.plot_data.end) {
				svg.append('line')
					.attr('x1', xPosition)
					.attr('x2', xPosition + cpgWidth)
					.attr('y1', y(value))
					.attr('y2', y(value))
					.style('stroke', cpgColor)
					.style('stroke-opacity', cpgOpacity)
					.attr('stroke-width', 1);
			}
		});
	}
	xPosition += cpgWidth + genomicFeatureSmallMargin;
	$.each(cancerTypeDataFiltered.cpgi_annotation, function(key, value) {
		var regionStart, regionEnd;
		regionStart = value.start;
		regionEnd = value.end;
		if (regionStart < cancerTypeDataFiltered.plot_data.end && regionEnd > cancerTypeDataFiltered.plot_data.start) {
			if (regionStart < cancerTypeDataFiltered.plot_data.start) {
				regionStart = cancerTypeDataFiltered.plot_data.start;
			}
			if (regionEnd > cancerTypeDataFiltered.plot_data.end) {
				regionEnd = cancerTypeDataFiltered.plot_data.end;
			}
			svg.append('rect')
				.attr('fill', cpgColor)
				.attr('x', xPosition)
				.attr('y', y(regionStart))
				.attr('width', cpgIslandWidth)
				.attr('height', Math.abs(y(regionStart) - y(regionEnd)));
		}
	});
	xPosition += cpgIslandWidth + genomicFeatureLargeMargin;

	// Plot any other regions (miRNAs and/or genes with their transcripts).
	var transcripts;
	$.each(cancerTypeDataFiltered.other_regions, function(key, value) {
		var regionStart, regionEnd, regionName;
		xPosition += genomicFeatureLargeMargin;
		regionStart = value.start;
		regionEnd = value.end;
		if (regionStart < cancerTypeDataFiltered.plot_data.end && regionEnd > cancerTypeDataFiltered.plot_data.start) {
			if (regionStart < cancerTypeDataFiltered.plot_data.start) {
				regionStart = cancerTypeDataFiltered.plot_data.start;
			}
			if (regionEnd > cancerTypeDataFiltered.plot_data.end) {
				regionEnd = cancerTypeDataFiltered.plot_data.end;
			}
			regionName = value.name ? value.name : value.ensembl_id;
			svg.append('rect')
				.attr('fill', otherRegionColor)
				.attr('x', xPosition)
				.attr('y', y(regionStart))
				.attr('width', regionWidth)
				.attr('height', Math.abs(y(regionStart) - y(regionEnd)))
				.attr('name', regionName)
				.on('mouseover', function() {
					var xPositionRegion = $(this).attr('x');
					var yPositionRegion = $(this).attr('y');
					var regionName = $(this).attr('name');
					svg.append('text')
						.attr('x', xPositionRegion)
						.attr('y', yPositionRegion - 5)
						.attr('stroke-width', 4)
						.attr('stroke', '#fff')
						.attr('text-anchor', 'start')
						.attr('alignment-baseline', 'baseline')
						.attr('class', 'other-region-annotation')
						.text(regionName);
					svg.append('text')
						.attr('x', xPositionRegion)
						.attr('y', yPositionRegion - 5)
						.attr('font-weight', 700)
						.attr('fill', otherRegionColor)
						.attr('text-anchor', 'start')
						.attr('alignment-baseline', 'baseline')
						.attr('class', 'other-region-annotation')
						.text(regionName);
				})
				.on('mouseout', function() {
					$('.other-region-annotation').remove();
				});

			// Add an arrow to indicate whether the region is located on the + or - strand.
			if (value.strand === '+' && value.end < cancerTypeDataFiltered.plot_data.end) {
				drawArrow(y, xPosition, value, otherRegionColor);
			} else if (value.strand === '-' && value.start > cancerTypeDataFiltered.plot_data.start) {
				drawArrow(y, xPosition, value, otherRegionColor);
			}
		}
		xPosition += regionWidth;
		if (value.region_type === 'gene') {
			// Add the transcripts.
			transcripts = value.transcripts;
			$.each(transcripts, function(key, value) {
				var transcriptStart, transcriptEnd;
				xPosition += genomicFeatureSmallMargin;
				transcriptStart = value.start;
				transcriptEnd = value.end;
				if (transcriptStart < cancerTypeDataFiltered.plot_data.end &&
					transcriptEnd > cancerTypeDataFiltered.plot_data.start) {
					if (transcriptStart < cancerTypeDataFiltered.plot_data.start) {
						transcriptStart = cancerTypeDataFiltered.plot_data.start;
					}
					if (transcriptEnd > cancerTypeDataFiltered.plot_data.end) {
						transcriptEnd = cancerTypeDataFiltered.plot_data.end;
					}
					svg.append('rect')
						.attr('fill', otherTranscriptColor)
						.attr('x', xPosition)
						.attr('y', y(transcriptStart))
						.attr('width', transcriptWidth)
						.attr('height', Math.abs(y(transcriptStart) - y(transcriptEnd)));
				}
				xPosition += transcriptWidth;
			});
		}
	});
	xPosition += genomicFeatureLargeMargin;

	// Draw the main region (miRNA or gene with its transcripts).
	var mainRegionStart = cancerTypeDataFiltered.region_annotation.start;
	var mainRegionEnd = cancerTypeDataFiltered.region_annotation.end;
	if (mainRegionStart < cancerTypeDataFiltered.plot_data.end && mainRegionEnd > cancerTypeDataFiltered.plot_data.start) {
		if (mainRegionStart < cancerTypeDataFiltered.plot_data.start) {
			mainRegionStart = cancerTypeDataFiltered.plot_data.start;
		}
		if (mainRegionEnd > cancerTypeDataFiltered.plot_data.end) {
			mainRegionEnd = cancerTypeDataFiltered.plot_data.end;
		}
		svg.append('rect')
			.attr('fill', regionColor)
			.attr('x', xPosition)
			.attr('y', y(mainRegionStart))
			.attr('width', regionWidth)
			.attr('height', Math.abs(y(mainRegionStart) - y(mainRegionEnd)));
		svg.append('text')
			.attr('x', xPosition)
			.attr('y', y(mainRegionStart) - 5)
			.attr('font-weight', 700)
			.attr('font-size', '12px')
			.attr('fill', regionColor)
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'baseline')
			.text(cancerTypeDataFiltered.region_annotation.name);
		xPosition += regionWidth;
		if (cancerTypeDataFiltered.region_annotation.strand === '+' &&
			cancerTypeDataFiltered.region_annotation.end < cancerTypeDataFiltered.plot_data.end) {
			drawArrow(y, xPosition - regionWidth, cancerTypeDataFiltered.region_annotation,
				regionColor);
		} else if (cancerTypeDataFiltered.region_annotation.strand === '-' &&
			cancerTypeDataFiltered.region_annotation.start > cancerTypeDataFiltered.plot_data.start) {
			drawArrow(y, xPosition - regionWidth, cancerTypeDataFiltered.region_annotation,
				regionColor);
		}
	}
	if (cancerTypeDataFiltered.region_annotation.region_type === 'gene') {
		// Add the transcripts.
		transcripts = cancerTypeDataFiltered.region_annotation.transcripts;
		$.each(transcripts, function(key, value) {
			var transcriptStart, transcriptEnd, exons;
			xPosition += genomicFeatureSmallMargin;
			transcriptStart = value.start;
			transcriptEnd = value.end;
			if (transcriptStart < cancerTypeDataFiltered.plot_data.end && transcriptEnd > cancerTypeDataFiltered.plot_data.start) {
				if (transcriptStart < cancerTypeDataFiltered.plot_data.start) {
					transcriptStart = cancerTypeDataFiltered.plot_data.start;
				}
				if (transcriptEnd > cancerTypeDataFiltered.plot_data.end) {
					transcriptEnd = cancerTypeDataFiltered.plot_data.end;
				}
				svg.append('rect')
					.attr('fill', transcriptColor)
					.attr('x', xPosition)
					.attr('y', y(transcriptStart))
					.attr('width', transcriptWidth)
					.attr('height', Math.abs(y(transcriptStart) - y(transcriptEnd)));
			}
			exons = value.exons;
			$.each(exons, function(key, value) {
				var exonStart, exonEnd;
				exonStart = value.start;
				exonEnd = value.end;
				if (exonStart < cancerTypeDataFiltered.plot_data.end &&
					exonEnd > cancerTypeDataFiltered.plot_data.start) {
					if (exonStart < cancerTypeDataFiltered.plot_data.start) {
						exonStart = cancerTypeDataFiltered.plot_data.start;
					}
					if (exonEnd > cancerTypeDataFiltered.plot_data.end) {
						exonEnd = cancerTypeDataFiltered.plot_data.end;
					}
					svg.append('rect')
						.attr('fill', exonColor)
						.attr('x', xPosition)
						.attr('y', y(exonStart))
						.attr('width', transcriptWidth)
						.attr('height', Math.abs(y(exonStart) - y(exonEnd)));
					}
			});
			xPosition += transcriptWidth;
		});
	}
	xPosition += genomicFeatureLargeMargin;

	// Draw the legend.
	xPosition += marginBetweenMainParts * 5;
	var yPosition = -topMargin;
	svg.append('text')
		.attr('x', xPosition)
		.attr('y', yPosition)
		.attr('font-weight', '700')
		.attr('font-size', '12px')
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'bottom')
		.text('Legend');
	yPosition += dataTrackHeight;
	$.each(categoricalClinicalParameters, function(index, value) {
		parameterText = value.replace(/_/g, ' ');
		if (parameterText.length > 35) {
			parameterText = parameterText.substr(0, 32) + '...';
		}
		svg.append('text')
			.attr('x', xPosition - marginBetweenMainParts / 2)
			.attr('y', yPosition + dataTrackHeight / 2)
			.attr('text-anchor', 'end')
			.attr('alignment-baseline', 'middle')
			.text(parameterText);

		// We want to map each categorical variable value to a specific color. When the user
		// filters the data, these color assignments should remain the same (e.g. if gender "male"
		// is blue in the default plot, it should remain blue after the user filters out female
		// patients).
		var allCategories = Object.values(cancerTypeData.phenotype[value]).filter(uniqueValues);
		allCategories.sort(sortAlphabetically);
		var re = new RegExp('^(clinical|pathologic)_|tumor_stage_*|clinical_stage_');
		var categoryColors;
		if (re.test(value)) {
			categoryColors = allCategories.map(function(x) {
				if (x) {
					if (allCategories.length <= stageColorsSimplified.length) {
						return stageColorsSimplified[allCategories.indexOf(x)];
					} else {
						return stageColors[allCategories.indexOf(x)];
					}
				} else {
					return missingValueColor;
				}
			});
		} else {
			categoryColors = allCategories.map(function(x) {
				if (x) {
					if (value === 'sample_type') {
						if (x in sampleTypeColors) {
							return sampleTypeColors[x];
						} else {
							return missingValueColor;
						}
					} else {
						return categoricalColors[allCategories.indexOf(x)];
					}
				} else {
					return missingValueColor;
				}
			});
		}
		var categories = Object.values(cancerTypeDataFiltered.phenotype[value]).filter(uniqueValues);
		categories.sort(sortAlphabetically);
		var xPositionLegend = 0;
		$.each(categories, function(i, v) {
			var vText = v ? v : 'null';
			vText = vText.replace(/_/g, ' ');
			var textWidth = calculateTextWidth(vText, '10px arial');
			var colorIndex = allCategories.indexOf(v);
			svg.append('rect')
				.attr('fill', categoryColors[colorIndex])
				.attr('x', xPosition + xPositionLegend)
				.attr('y', yPosition + Math.floor(dataTrackHeight / 2) - legendRectHeight / 2)
				.attr('width', legendRectWidth)
				.attr('height', legendRectHeight);
			svg.append('text')
				.attr('x', xPosition + legendRectWidth + 5 + xPositionLegend)
				.attr('y', yPosition + dataTrackHeight / 2)
				.attr('text-anchor', 'start')
				.attr('alignment-baseline', 'middle')
				.text(vText);
			xPositionLegend += textWidth + 2 * legendRectWidth + 5;
		});
		yPosition += dataTrackHeight + dataTrackSeparator;
	});
	if (showVariants) {
		xPositionLegend = 0;
		svg.append('text')
			.attr('x', xPosition - marginBetweenMainParts / 2)
			.attr('y', yPosition + dataTrackHeight / 2)
			.attr('text-anchor', 'end')
			.attr('alignment-baseline', 'middle')
			.text('somatic mutations');
		var variantColors = variantCategories.map(function(x) {
			if (x) {
				return categoricalColors[variantCategories.indexOf(x)];
			} else {
				return missingValueColor;
			}
		});
		if (variantCategories.length === 0) {
			svg.append('text')
				.attr('fill', textColorLight)
				.attr('x', xPosition + xPositionLegend)
				.attr('y', yPosition + dataTrackHeight / 2)
				.attr('text-anchor', 'start')
				.attr('alignment-baseline', 'middle')
				.text('None');
		} else {
			$.each(variantCategories, function(index, value) {
				value = value ? value : 'null';
				var textWidth = calculateTextWidth(value.replace(/_/g, ' '), '10px arial');
				svg.append('circle')
					.attr('cx', xPosition + xPositionLegend + legendRectWidth / 2)
					.attr('cy', yPosition + Math.floor(dataTrackHeight / 2))
					.attr('r', legendCircleR)
					.attr('fill', variantColors[index]);
				svg.append('text')
					.attr('x', xPosition + legendRectWidth + 5 + xPositionLegend)
					.attr('y', yPosition + dataTrackHeight / 2)
					.attr('text-anchor', 'start')
					.attr('alignment-baseline', 'middle')
					.text(value.replace(/_/g, ' '));
				xPositionLegend += textWidth + 2 * legendRectWidth + 5;
			});
		}
		yPosition += dataTrackHeight + dataTrackSeparator;
	}
	var xPositionLegend = 0;
	if (cancerTypeDataFiltered.cnv) {
		svg.append('text')
			.attr('x', xPosition - marginBetweenMainParts / 2)
			.attr('y', yPosition + dataTrackHeight / 2)
			.attr('text-anchor', 'end')
			.attr('alignment-baseline', 'middle')
			.text('copy number');
		var cnvCategoryValues = [-2, -1, 0, 1, 2];
		$.each(cnvCategories, function(i, v) {
			v = v ? v : 'null';
			var textWidth = calculateTextWidth(v, '10px arial');
			var cnvFactor = 4 / dataTrackHeight; // The copy number values range from -2 to 2.
			var rectHeight, rectCol, yPositionRect;
			yPositionRect = yPosition;
			rectHeight = Math.abs(cnvCategoryValues[i] / cnvFactor);
			if (cnvCategoryValues[i] < 0) {
				yPositionRect += dataTrackHeight / 2;
				rectCol = otherRegionColor;
			} else {
				yPositionRect += dataTrackHeight / 2 - rectHeight;
				rectCol = regionColor;
			}
			svg.append('line')
				.attr('x1', xPosition + xPositionLegend - 2)
				.attr('x2', xPosition + xPositionLegend + 4)
				.attr('y1', yPosition + dataTrackHeight / 2)
				.attr('y2', yPosition + dataTrackHeight / 2)
				.attr('stroke', otherRegionColor)
				.attr('stroke-width', 1);
			svg.append('rect')
				.attr('fill', rectCol)
				.attr('x', xPosition + xPositionLegend)
				.attr('y', yPositionRect)
				.attr('width', sampleWidth * 2)
				.attr('height', rectHeight);
			svg.append('text')
				.attr('x', xPosition + sampleWidth + 5 + xPositionLegend)
				.attr('y', yPosition + dataTrackHeight / 2)
				.attr('text-anchor', 'start')
				.attr('alignment-baseline', 'middle')
				.text(v);
			xPositionLegend += textWidth + 5 * sampleWidth + 5;
		});
		yPosition += dataTrackHeight + dataTrackSeparator;
	}
	if (addStats) {
		svg.append('text')
			.attr('x', xPosition - marginBetweenMainParts / 2)
			.attr('y', yPosition + dataTrackHeight / 2)
			.attr('text-anchor', 'end')
			.attr('alignment-baseline', 'middle')
			.text('statistics');
		var statsLegend = ['p >= 0.05', '* p < 0.05', '** p < 0.01', '*** p < 0.001'];
		xPositionLegend = 0;
		$.each(statsLegend, function(i, v) {
			var statsTextColor = v === 'p >= 0.05' ? textColorLight : textColor;
			var textWidth = calculateTextWidth(v, '10px arial');
			svg.append('text')
				.attr('fill', statsTextColor)
				.attr('x', xPosition + xPositionLegend)
				.attr('y', yPosition + dataTrackHeight / 2)
				.attr('text-anchor', 'start')
				.attr('alignment-baseline', 'middle')
				.text(v);
			xPositionLegend += textWidth + 5 * sampleWidth + 5;
		});
	}

	// Draw a horizontal line under the legend to separate it better from the actual data.
	svg.append('line')
		.attr('x1', -margin.left)
		.attr('y1', Math.round(yPosition + dataTrackHeight + marginBetweenMainParts))
		.attr('x2', width + margin.right)
		.attr('y2', Math.round(yPosition + dataTrackHeight + marginBetweenMainParts))
		.attr('class', 'legend-separator')
		.attr('stroke', textColorLight);

	// Draw the phenotype data.
	$.each(clinicalParameters, function(index, parameter) {
		yPosition = -topMargin + legendHeight + marginBetweenMainParts * 3 +
					 index * (dataTrackHeight + dataTrackSeparator);
		var phenotypeData = cancerTypeDataFiltered.phenotype[parameter];
		drawDataTrack(phenotypeData, samples, allSamples, regionColor, xPosition, yPosition, parameter);
	});

	// Draw the expression data. This includes the gene/miRNA expression and copy number variation
	// data (if available).
	// 1. Gene/miRNA expression
	yPosition += dataTrackHeight + marginBetweenMainParts;
	var regionExpressionDataValues = cancerTypeDataFiltered.region_expression;
	drawDataTrack(regionExpressionDataValues, samples, allSamples, regionColor, xPosition, yPosition,
		cancerTypeDataFiltered.region_annotation.name + ' expression');

	// 2. Copy number variation
	if (cancerTypeDataFiltered.cnv) {
		yPosition += dataTrackHeight + dataTrackSeparator;
		var copyNumberDataValues = cancerTypeDataFiltered.cnv;
		drawDataTrackCopyNumber(copyNumberDataValues, samples, xPosition, yPosition);
	}

	// Draw the DNA methylation data.
	var orderedProbes = Object.keys(cancerTypeDataFiltered.probe_annotation).sort(function(a,b) {
		return cancerTypeDataFiltered.probe_annotation[a].cpg_location -
			cancerTypeDataFiltered.probe_annotation[b].cpg_location;
	});
	$.each(orderedProbes, function(index, value) {
		var probeLocation = cancerTypeDataFiltered.probe_annotation[value].cpg_location;
		var nrVariants = 0;
		if (showVariants) {
			// We need to leave enough room to plot the somatic mutations.
			nrVariants = Object.keys(filteredVariants).filter(function(x) {
				return x < probeLocation;
			}).length;
		}
		var yPosition = marginBetweenMainParts +
						index * (dataTrackHeight + dataTrackSeparator) +
						nrVariants * (dataTrackHeightVariants + dataTrackSeparator);
		var methylationValues = cancerTypeDataFiltered.dna_methylation_data[value];
		drawDataTrack(methylationValues, samples, allSamples, otherRegionColor, xPosition, yPosition, 'methylation');

		// Draw a transparent rectangle on top of the DNA methylation track that shows the probe
		// annotation when clicked by a user.
		svg.append('rect')
			.attr('fill', '#fff')
			.attr('fill-opacity', 0)
			.attr('x', xPosition)
			.attr('y', yPosition)
			.attr('width', samples.length * sampleWidth)
			.attr('height', dataTrackHeight)
			.attr('id', value)
			.attr('class', 'clickable')
			.on('mouseover', function() {
				var probeId = $(this).attr('id');
				var probePath = $('.' + probeId);
				if (!probePath.hasClass('highlighted-promoter')) {
					probePath.css({'stroke': textColor});
				}
			})
			.on('mouseout', function() {
				var probeId = $(this).attr('id');
				var probePath = $('.' + probeId);
				if (!probePath.hasClass('highlighted') && !probePath.hasClass('highlighted-promoter')) {
					probePath.css({'stroke': probeLineColor});
				}
			})
			.on('mouseup', function(event) {
				var probeId = $(this).attr('id');
				var probePath = $('.' + probeId);
				var probeAnnotation = cancerTypeDataFiltered.probe_annotation[probeId];
				var xPositionAnnotation = d3.event.clientX -
					$('.svg-container').find('svg')[0].getBoundingClientRect().x -
					margin.left + 20;
				$('.probe-annotation').remove();
				if (probePath.hasClass('highlighted')) {
					probePath.removeClass('highlighted');
					if (!probePath.hasClass('highlighted-promoter')) {
						probePath.css({'stroke': probeLineColor});
					}
				} else {
					$('.highlighted').css({'stroke': probeLineColor});
					$('.highlighted').removeClass('highlighted');
					probePath.addClass('highlighted');
					if (!probePath.hasClass('highlighted-promoter')) {
						probePath.css({'stroke': textColor});
					}
					addProbeAnnotation(probeId, probeAnnotation, xPositionAnnotation, yPosition);
				}
			});
	});

	// Draw the variant data.
	variantCounter = 0;
	if (showVariants) {
		$.each(filteredVariants, function(position, snv) {
			var nrProbes = probeLocations.filter(function(x) {
				return x < position;
			}).length;
			var yPositionDataTrack = marginBetweenMainParts +
									 variantCounter * (dataTrackHeightVariants + dataTrackSeparator) +
									 nrProbes * (dataTrackHeight + dataTrackSeparator);
			drawDataTrackVariants(snv, samples, position, xPosition, yPositionDataTrack);
			variantCounter += 1;
		});
	}

	// Add the statistics.
	if (addStats) {
		var yPositionStat;
		var xPositionStat = xPosition + samples.length * sampleWidth + genomicFeatureLargeMargin;
		var dataTrackCount = 0;
		var statText, statTextColor;
		$.each(clinicalParameters, function(index, value) {
			var statData = stats.phenotype[value];
			yPositionStat = -topMargin + legendHeight + marginBetweenMainParts * 3 +
							dataTrackCount * (dataTrackHeight + dataTrackSeparator);
			addStatistic(statData, xPositionStat, yPositionStat);
			dataTrackCount += 1;
		});
		yPositionStat += dataTrackHeight + marginBetweenMainParts;
		if (stats.region_expression) {
			addStatistic(stats.region_expression, xPositionStat, yPositionStat);
		}
		yPositionStat += dataTrackHeight + dataTrackSeparator;
		if (stats.cnv) {
			addStatistic(stats.cnv, xPositionStat, yPositionStat);
		}
		$.each(stats.dna_methylation_data, function(key, value) {
			var probeIndex = orderedProbes.indexOf(key);
			var probeLocation = cancerTypeDataFiltered.probe_annotation[key].cpg_location;
			var nrVariants = 0;
			if (showVariants) {
				// We need to skip any variant tracks.
				nrVariants = Object.keys(filteredVariants).filter(function(x) {
					return x < probeLocation;
				}).length;
			}
			var yPositionStat = marginBetweenMainParts +
								probeIndex * (dataTrackHeight + dataTrackSeparator) +
								nrVariants * (dataTrackHeightVariants + dataTrackSeparator);
			addStatistic(value, xPositionStat, yPositionStat);
		});
	}
	$('.plot-loader').hide();
};

var plotSummary = function(sorter, showVariants, plotStart, plotEnd) {
	$('.svg-container > svg').remove();
	
	// The summarized plot consists of three main parts:
	// 1. genomic annotation data (miRNAs, genes, transcripts, CpG islands)
	// 2. location-linked data (DNA methylation and somatic mutations)
	// 3. sample-linked data (expression, copy number variation, clinical data)
	// It differs from the default plot in that the genome is plotted horizontally, instead of
	// vertically. The DNA methylation data is summarized (median, quantiles, variance...) and
	// the correlation with expression is shown, rather than the actual expression data.
	// In order to draw an accurate plot we need to count:
	// - the number of genomic features/regions
	// -=> will determine the height of the plot
	//
	// The DNA methylation data is split up into different groups, depending on the sorter. In the
	// case of a categorical sorter (e.g. sample type), we can just use these categories. In the
	// case of a numerical sorter (e.g. gene expression), we will have to create new groups.
	var sorterData;
	var sorterDataValues;
	var groups = {};
	if (sorter in cancerTypeDataFiltered) {
		sorterData = cancerTypeDataFiltered[sorter];
	} else if (sorter in cancerTypeDataFiltered.phenotype) {
		sorterData = cancerTypeDataFiltered.phenotype[sorter];
	} else {
		sorterData = null;
	}
	if (sorterData === null) {
		groups['all samples'] = cancerTypeDataFiltered.samples_filtered_sorted;
	} else {
		sorterDataValues = Object.values(sorterData);
		if (parameterIsNumerical(sorterDataValues)) {
			// Split the samples in two groups based on whether their value is greater or smaller than
			// the median value.
			var sorterSummary = summary(sorterDataValues);
			var highValueSamples = [];
			var lowValueSamples = [];
			$.each(sorterData, function(key, value) {
				if (value === null) {
					return true; // Continue to the next iteration.
				} else if (+value >= sorterSummary.median) {
					highValueSamples.push(key);
				} else {
					lowValueSamples.push(key);
				}
			});
			groups['low ' + sorter.replace(/_/g, ' ')] = lowValueSamples;
			groups['high ' + sorter.replace(/_/g, ' ')] = highValueSamples;
		} else {
			sorterDataValues = Object.values(sorterData);
			var categories = sorterDataValues.filter(uniqueValues);
			categories.sort(sortAlphabetically);
			$.each(categories, function(index, value) {
				value = value ? value : 'null';
				groups[value.replace(/_/g, ' ')] = [];
			});
			$.each(sorterData, function(key, value) {
				value = value ? value : 'null';
				groups[value.replace(/_/g, ' ')].push(key);
			});
		}	
	}
	$.each(groups, function(key, value) {
		if (value.length <= 3) {
			delete groups[key];
		}
	});
	var groupNames = Object.keys(groups);

	// Count the number of regions (including transcripts in the case of genes) that need to be
	// drawn.
	var nrOtherGenes = cancerTypeDataFiltered.other_regions.filter(isRegion('gene')).length;
	var nrTranscripts = 0;
	if (cancerTypeDataFiltered.region_annotation.region_type === 'gene') {
		nrTranscripts = Object.keys(cancerTypeDataFiltered.region_annotation.transcripts).length;
	}
	var nrOtherTranscripts = 0;
	$.each(cancerTypeDataFiltered.other_regions.filter(isRegion('gene')), function(key, value) {
		nrOtherTranscripts += Object.keys(value.transcripts).length;
	});
	var nrOtherMirnas = cancerTypeDataFiltered.other_regions.filter(isRegion('mirna')).length;
	var genomicFeaturesHeight = genomicFeatureLargeMargin +
								genomicCoordinatesHeight +
								genomicFeatureSmallMargin +
								cpgHeight +
								genomicFeatureSmallMargin +
								cpgIslandHeight +
								genomicFeatureLargeMargin +
								regionHeight +
								genomicFeatureSmallMargin +
								nrTranscripts * transcriptHeight +
								(nrTranscripts - 1) * genomicFeatureSmallMargin +
								genomicFeatureLargeMargin +
								nrOtherGenes * regionHeight +
								(nrOtherGenes - 1) * genomicFeatureSmallMargin +
								genomicFeatureLargeMargin +
								nrOtherTranscripts * transcriptHeight +
								(nrOtherTranscripts - 1) * genomicFeatureSmallMargin +
								genomicFeatureLargeMargin +
								nrOtherMirnas * regionHeight +
								(nrOtherMirnas - 1) * genomicFeatureLargeMargin +
								genomicFeatureLargeMargin;

	// Calculate the width of the groups legend.
	var legendWidth = 0;
	$.each(groupNames, function(index, value) {
		value = value ? value : 'null';
		var textWidth = calculateTextWidth(value.replace(/_/g, ' '), '10px arial');
		legendWidth += textWidth + 2 * legendRectWidth + 5;
	});

	// Build the SVG.
	var height = 200;
	var linePlotWidth = 800;
	var plotWidth = legendWidth > linePlotWidth ? legendWidth : linePlotWidth;
	var margin = {top: 120,
				  left: 140,
				  bottom: 40 + genomicCoordinatesHeight + genomicFeaturesHeight + genomicFeatureLargeMargin,
				  right: 100 + (plotWidth - linePlotWidth)};
	var x = d3.scaleLinear().domain([plotStart, plotEnd]).range([0, linePlotWidth]);
	var y = d3.scaleLinear().domain([0, 1]).range([height, 0]);
	svg = d3.select('.svg-container')
		.append('svg')
			.attr('width', linePlotWidth + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.attr('text-rendering', 'geometricPrecision')
			.attr('font-family', 'arial')
			.attr('font-size', '10px')
			.attr('fill', textColor)
		.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	// Add a white background to the SVG.
	svg.append('rect')
		.attr('x', -margin.left)
		.attr('y', -margin.top)
		.attr('width', linePlotWidth + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.attr('fill', '#fff');

	// Add the genomic coordinates (= x axis).
	drawCoordinates(x, true, height + margin.bottom);

	// Add the y axis (DNA methylation beta values: [0,1]).
	svg.append('line')
		.attr('x1', x(plotStart))
		.attr('x2', x(plotEnd))
		.attr('y1', y(0))
		.attr('y2', y(0))
		.attr('shape-rendering', 'crispEdges')
		.attr('stroke', probeLineColor);
	svg.append('line')
		.attr('x1', x(plotStart))
		.attr('x2', x(plotEnd))
		.attr('y1', y(0.5))
		.attr('y2', y(0.5))
		.attr('shape-rendering', 'crispEdges')
		.attr('stroke', probeLineColor);
	svg.append('line')
		.attr('x1', x(plotStart))
		.attr('x2', x(plotEnd))
		.attr('y1', y(1))
		.attr('y2', y(1))
		.attr('shape-rendering', 'crispEdges')
		.attr('stroke', probeLineColor);
	svg.append('g')
		.attr('class', 'axis')
		.call(d3.axisLeft(y)
			.tickValues([0, 0.2, 0.4, 0.6, 0.8, 1]));
	d3.selectAll('.axis path')
		.attr('stroke', textColor);
	d3.selectAll('.axis text')
		.attr('font-size', '10px')
		.attr('font-family', 'arial')
		.attr('fill', textColor);
	d3.selectAll('.axis line')
		.attr('stroke', textColor);
	svg.append('text')
		.attr('x', 0)
		.attr('y', y(1) - genomicCoordinatesHeight)
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'baseline')
		.attr('fill', textColor)
		.attr('font-size', '12px')
		.text('beta value');

	// Draw the individual CpGs and the CpG islands.
	// Adapt the opacity of the CpG lines to the length of the plot window. Otherwise the CpG plot
	// is just one big block of green for long genes (and large plot windows). For really long
	// genes (length > 200kb), we will simply not draw the individual CpGs. They become one big
	// green blob anyway.
	// Start by adding a small legend below the genome annotation that explains the different
	// parts.
	var yPositionLegend = height + margin.bottom - 2 * genomicFeatureLargeMargin -
		2 * genomicCoordinatesHeight - cpgHeight;
	var xPosition = -margin.left + genomicFeatureLargeMargin * 2;
	svg.append('line')
		.attr('x1', xPosition)
		.attr('x2', xPosition + cpgWidth)
		.attr('y1', yPositionLegend)
		.attr('y2', yPositionLegend)
		.style('stroke', cpgColor)
		.attr('stroke-width', sampleWidth);
	svg.append('text')
		.attr('x', xPosition + cpgWidth + genomicFeatureLargeMargin)
		.attr('y', yPositionLegend)
		.attr('fill', textColor)
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'middle')
		.text('CpG dinucleotide');
	yPositionLegend -= dataTrackHeight;
	svg.append('line')
		.attr('x1', xPosition)
		.attr('x2', xPosition + cpgWidth)
		.attr('y1', yPositionLegend)
		.attr('y2', yPositionLegend)
		.style('stroke', cpgColor)
		.attr('stroke-width', cpgIslandHeight);
	svg.append('text')
		.attr('x', xPosition + cpgWidth + genomicFeatureLargeMargin)
		.attr('y', yPositionLegend)
		.attr('fill', textColor)
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'middle')
		.text('CpG island');
	yPositionLegend -= dataTrackHeight;
	svg.append('line')
		.attr('x1', xPosition)
		.attr('x2', xPosition + cpgWidth)
		.attr('y1', yPositionLegend)
		.attr('y2', yPositionLegend)
		.style('stroke', regionColor)
		.attr('stroke-width', regionHeight);
	svg.append('text')
		.attr('x', xPosition + cpgWidth + genomicFeatureLargeMargin)
		.attr('y', yPositionLegend)
		.attr('fill', textColor)
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'middle')
		.text(cancerTypeDataFiltered.region_annotation.region_type);
	yPositionLegend -= dataTrackHeight;
	svg.append('line')
		.attr('x1', xPosition)
		.attr('x2', xPosition + cpgWidth)
		.attr('y1', yPositionLegend)
		.attr('y2', yPositionLegend)
		.style('stroke', transcriptColor)
		.attr('stroke-width', transcriptHeight);
	svg.append('text')
		.attr('x', xPosition + cpgWidth + genomicFeatureLargeMargin)
		.attr('y', yPositionLegend)
		.attr('fill', textColor)
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'middle')
		.text('transcript');
	var yPosition = height + margin.bottom - 2 * genomicFeatureLargeMargin - 2 * genomicCoordinatesHeight;
	var plotWindowLength = Math.abs(cancerTypeDataFiltered.plot_data.start -
		cancerTypeDataFiltered.plot_data.end);
	var cpgOpacity = 1;
	if (plotWindowLength < 200000) {
		cpgOpacity = 1 - plotWindowLength / 200000;
		$.each(cancerTypeDataFiltered.region_annotation.cpg_locations, function(index, value) {
			if (value > cancerTypeDataFiltered.plot_data.start && value < cancerTypeDataFiltered.plot_data.end) {
				svg.append('line')
					.attr('x1', x(value))
					.attr('x2', x(value))
					.attr('y1', yPosition)
					.attr('y2', yPosition - cpgHeight)
					.style('stroke', cpgColor)
					.style('stroke-opacity', cpgOpacity)
					.attr('stroke-width', 1);
			}
		});
	}
	yPosition -= cpgHeight + genomicFeatureSmallMargin;
	$.each(cancerTypeDataFiltered.cpgi_annotation, function(key, value) {
		var regionStart, regionEnd;
		regionStart = value.start;
		regionEnd = value.end;
		if (regionStart < cancerTypeDataFiltered.plot_data.end && regionEnd > cancerTypeDataFiltered.plot_data.start) {
			if (regionStart < cancerTypeDataFiltered.plot_data.start) {
				regionStart = cancerTypeDataFiltered.plot_data.start;
			}
			if (regionEnd > cancerTypeDataFiltered.plot_data.end) {
				regionEnd = cancerTypeDataFiltered.plot_data.end;
			}
			svg.append('rect')
				.attr('fill', cpgColor)
				.attr('x', x(regionStart))
				.attr('y', yPosition - cpgIslandHeight)
				.attr('width', Math.abs(x(regionStart) - x(regionEnd)))
				.attr('height', cpgIslandHeight);
		}
	});
	yPosition -= cpgIslandHeight + genomicFeatureLargeMargin;

	// Plot any other regions (miRNAs and/or genes with their transcripts).
	var transcripts;
	$.each(cancerTypeDataFiltered.other_regions, function(key, value) {
		var regionStart, regionEnd, regionName;
		yPosition -= genomicFeatureLargeMargin;
		regionStart = value.start;
		regionEnd = value.end;
		if (regionStart < cancerTypeDataFiltered.plot_data.end && regionEnd > cancerTypeDataFiltered.plot_data.start) {
			if (regionStart < cancerTypeDataFiltered.plot_data.start) {
				regionStart = cancerTypeDataFiltered.plot_data.start;
			}
			if (regionEnd > cancerTypeDataFiltered.plot_data.end) {
				regionEnd = cancerTypeDataFiltered.plot_data.end;
			}
			regionName = value.name ? value.name : value.ensembl_id;
			svg.append('rect')
				.attr('fill', otherRegionColor)
				.attr('x', x(regionStart))
				.attr('y', yPosition)
				.attr('width', Math.abs(x(regionStart) - x(regionEnd)))
				.attr('height', regionHeight)
				.attr('name', regionName)
				.on('mouseover', function() {
					var xPositionRegion = +$(this).attr('x');
					var yPositionRegion = +$(this).attr('y');
					var regionName = $(this).attr('name');
					svg.append('text')
						.attr('x', xPositionRegion - 5)
						.attr('y', yPositionRegion + regionHeight)
						.attr('stroke-width', 4)
						.attr('stroke', '#fff')
						.attr('text-anchor', 'end')
						.attr('alignment-baseline', 'baseline')
						.attr('class', 'other-region-annotation')
						.text(regionName);
					svg.append('text')
						.attr('x', xPositionRegion - 5)
						.attr('y', yPositionRegion + regionHeight)
						.attr('font-weight', 700)
						.attr('fill', otherRegionColor)
						.attr('text-anchor', 'end')
						.attr('alignment-baseline', 'baseline')
						.attr('class', 'other-region-annotation')
						.text(regionName);
				})
				.on('mouseout', function() {
					$('.other-region-annotation').remove();
				});

			// Add an arrow to indicate whether the region is located on the + or - strand.
			if (value.strand === '+' && value.end < cancerTypeDataFiltered.plot_data.end) {
				drawHorizontalArrow(x, yPosition, value, otherRegionColor);
			} else if (value.strand === '-' && value.start > cancerTypeDataFiltered.plot_data.start) {
				drawHorizontalArrow(x, yPosition, value, otherRegionColor);
			}
		}
		yPosition -= regionHeight;
		if (value.region_type === 'gene') {
			// Add the transcripts.
			transcripts = value.transcripts;
			$.each(transcripts, function(key, value) {
				var transcriptStart, transcriptEnd;
				yPosition -= genomicFeatureSmallMargin;
				transcriptStart = value.start;
				transcriptEnd = value.end;
				if (transcriptStart < cancerTypeDataFiltered.plot_data.end &&
					transcriptEnd > cancerTypeDataFiltered.plot_data.start) {
					if (transcriptStart < cancerTypeDataFiltered.plot_data.start) {
						transcriptStart = cancerTypeDataFiltered.plot_data.start;
					}
					if (transcriptEnd > cancerTypeDataFiltered.plot_data.end) {
						transcriptEnd = cancerTypeDataFiltered.plot_data.end;
					}
					svg.append('rect')
						.attr('fill', otherTranscriptColor)
						.attr('x', x(transcriptStart))
						.attr('y', yPosition)
						.attr('width', Math.abs(x(transcriptStart) - x(transcriptEnd)))
						.attr('height', transcriptHeight);
				}
				yPosition -= transcriptHeight;
			});
		}
	});
	yPosition -= genomicFeatureLargeMargin + regionHeight;

	// Draw the main region (miRNA or gene with its transcripts).
	var mainRegionStart = cancerTypeDataFiltered.region_annotation.start;
	var mainRegionEnd = cancerTypeDataFiltered.region_annotation.end;
	if (mainRegionStart < cancerTypeDataFiltered.plot_data.end && mainRegionEnd > cancerTypeDataFiltered.plot_data.start) {
		if (mainRegionStart < cancerTypeDataFiltered.plot_data.start) {
			mainRegionStart = cancerTypeDataFiltered.plot_data.start;
		}
		if (mainRegionEnd > cancerTypeDataFiltered.plot_data.end) {
			mainRegionEnd = cancerTypeDataFiltered.plot_data.end;
		}
		svg.append('rect')
			.attr('fill', regionColor)
			.attr('x', x(mainRegionStart))
			.attr('y', yPosition)
			.attr('width', Math.abs(x(mainRegionStart) - x(mainRegionEnd)))
			.attr('height', regionHeight);
		svg.append('text')
			.attr('x', x(mainRegionStart) - 5)
			.attr('y', yPosition + regionHeight)
			.attr('font-weight', 700)
			.attr('fill', regionColor)
			.attr('text-anchor', 'end')
			.attr('alignment-baseline', 'baseline')
			.text(cancerTypeDataFiltered.region_annotation.name);
		yPosition -= regionHeight;
		if (cancerTypeDataFiltered.region_annotation.strand === '+' &&
			cancerTypeDataFiltered.region_annotation.end < cancerTypeDataFiltered.plot_data.end) {
			drawHorizontalArrow(x, yPosition + regionHeight, cancerTypeDataFiltered.region_annotation,
				regionColor);
		} else if (cancerTypeDataFiltered.region_annotation.strand === '-' &&
			cancerTypeDataFiltered.region_annotation.start > cancerTypeDataFiltered.plot_data.start) {
			drawHorizontalArrow(x, yPosition + regionHeight, cancerTypeDataFiltered.region_annotation,
				regionColor);
		}
	}
	if (cancerTypeDataFiltered.region_annotation.region_type === 'gene') {
		// Add the transcripts.
		transcripts = cancerTypeDataFiltered.region_annotation.transcripts;
		$.each(transcripts, function(key, value) {
			var transcriptStart, transcriptEnd, exons;
			yPosition -= genomicFeatureSmallMargin;
			transcriptStart = value.start;
			transcriptEnd = value.end;
			if (transcriptStart < cancerTypeDataFiltered.plot_data.end && transcriptEnd > cancerTypeDataFiltered.plot_data.start) {
				if (transcriptStart < cancerTypeDataFiltered.plot_data.start) {
					transcriptStart = cancerTypeDataFiltered.plot_data.start;
				}
				if (transcriptEnd > cancerTypeDataFiltered.plot_data.end) {
					transcriptEnd = cancerTypeDataFiltered.plot_data.end;
				}
				svg.append('rect')
					.attr('fill', transcriptColor)
					.attr('x', x(transcriptStart))
					.attr('y', yPosition)
					.attr('width', Math.abs(x(transcriptStart) - x(transcriptEnd)))
					.attr('height', transcriptHeight);
			}
			exons = value.exons;
			$.each(exons, function(key, value) {
				var exonStart, exonEnd;
				exonStart = value.start;
				exonEnd = value.end;
				if (exonStart < cancerTypeDataFiltered.plot_data.end &&
					exonEnd > cancerTypeDataFiltered.plot_data.start) {
					if (exonStart < cancerTypeDataFiltered.plot_data.start) {
						exonStart = cancerTypeDataFiltered.plot_data.start;
					}
					if (exonEnd > cancerTypeDataFiltered.plot_data.end) {
						exonEnd = cancerTypeDataFiltered.plot_data.end;
					}
					svg.append('rect')
						.attr('fill', exonColor)
						.attr('x', x(exonStart))
						.attr('y', yPosition)
						.attr('width', Math.abs(x(exonStart) - x(exonEnd)))
						.attr('height', transcriptHeight);
					}
			});
			yPosition -= transcriptHeight;
		});
	}
	
	// Calculate and draw the median DNA methylation value for each group and each probe. In case
	// the groups are the categories of a phenotype variable, ensure that the groups have the same
	// colors as the categories in the default plot.
	var re = new RegExp('^(clinical|pathologic)_|tumor_stage_*|clinical_stage_');
	var groupColors;
	if (re.test(sorter)) {
		groupColors = groupNames.map(function(x) {
			if (x !== 'null') {
				if (groupNames.length <= stageColorsSimplified.length) {
					return stageColorsSimplified[groupNames.indexOf(x)];
				} else {
					return stageColors[groupNames.indexOf(x)];
				}
			} else {
				return missingValueColor;
			}
		});
	} else {
		groupColors = groupNames.map(function(x) {
			if (x !== 'null') {
				return categoricalColors[groupNames.indexOf(x)];
			} else {
				return missingValueColor;
			}
		});
	}

	// To prevent the DNA methylation data lines for different groups at the same probe location
	// from overlapping, we'll add a small x adjustment to each group.
	var nrGroups = Object.keys(groups).length;
	var nrGroupsFactor = Math.floor(nrGroups / 2);
	var xAdj = [];
	for (i = -nrGroupsFactor; i <= nrGroupsFactor; i++) {
		xAdj.push(i * 2);
	}
	var groupsLineData = {};
	$.each(groups, function(key, value) {
		groupsLineData[key] = [];
	});
	$.each(cancerTypeDataFiltered.dna_methylation_data, function(key, value) {
		var probeLocation = cancerTypeDataFiltered.probe_annotation[key].cpg_location;
		var groupData = [];
		$.each(groups, function(group, samples) {
			var groupValues = [];
			var groupColor = groupColors[groupNames.indexOf(group)];
			$.each(samples, function(index, sample) {
				if (cancerTypeDataFiltered.samples_filtered_sorted.indexOf(sample) > -1) {
					groupValues.push(value[sample]);
				}
			});
			var methylationSummary = summary(groupValues, true);
			groupData.push(groupValues);
			groupsLineData[group].push({x: probeLocation + xAdj[groupNames.indexOf(group)],
				y:methylationSummary.median});
			if (methylationSummary.median !== null) {
				svg.append('line')
					.attr('x1', x(probeLocation) - 4 + xAdj[groupNames.indexOf(group)])
					.attr('x2', x(probeLocation) + 4 + xAdj[groupNames.indexOf(group)])
					.attr('y1', y(methylationSummary.median))
					.attr('y2', y(methylationSummary.median))
					.attr('stroke', groupColor)
					.attr('stroke-width', '2px');
			}
			if (methylationSummary.quantile25 !== null && methylationSummary.quantile75 !== null) {
				svg.append('line')
					.attr('x1', x(probeLocation) + xAdj[groupNames.indexOf(group)])
					.attr('x2', x(probeLocation) + xAdj[groupNames.indexOf(group)])
					.attr('y1', y(methylationSummary.quantile25))
					.attr('y2', y(methylationSummary.quantile75))
					.attr('stroke', groupColor)
					.attr('shape-rendering', 'crispEdges')
					.attr('stroke-width', '1px');
			}
		});
		var p;
		if (nrGroups === 2) {
			p = tTest(groupData[0], groupData[1]);
		} else if (nrGroups > 2) {
			p = anova(groupData);
		}
		var probeLocationLineColor = textColorLight;
		var probeSignificance = '';
		if (p) {
			if (!isNaN(p) && p < 0.05) {
				probeLocationLineColor = textColor;
				probeSignificance = '*';
				if (p < 0.01) {
					probeSignificance = '**';
				}
				if (p < 0.001) {
					probeSignificance = '***';
				}
			}
		}

		// Draw a line to indicate the location of the probe.
		svg.append('line')
			.attr('x1', x(probeLocation))
			.attr('x2', x(probeLocation))
			.attr('y1', height + genomicFeatureLargeMargin)
			.attr('y2', height + genomicFeatureLargeMargin + cpgHeight)
			.attr('stroke', probeLocationLineColor)
			.attr('shape-rendering', 'crispEdges')
			.attr('stroke-width', sampleWidth);
		var yPositionText = height + genomicFeatureLargeMargin + cpgHeight + genomicFeatureSmallMargin;
		svg.append('text')
			.attr('x', x(probeLocation))
			.attr('y', yPositionText)
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'middle')
			.attr('transform', 'rotate(90, ' + (x(probeLocation) - 3) + ',' + yPositionText + ')')
			.text(probeSignificance);
	});

	// Draw a line that connects the different median DNA methylation values at consecutive probes.
	var line = d3.line()
		.defined(function(d) {
			return d.y !== null;
		})
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); });
	$.each(groupsLineData, function(group, data) {
		// The d3.line function automatically adds a 'Z' to the end of the SVG path data, which
		// closes the path by drawing a line from the last point of the path to the first. If we
		// specify the 'fill' attribute of the path to be 'none', the path won't appear to be
		// closed in the browser. However, when a user downloads the plot as an .svg file and then
		// opens this file in Adobe Illustrator, the line paths are in fact closed, because of the
		// trailing 'Z'. To prevent this, we remove this trailing 'Z' (or 'z') from the path data:
		var lineData = line(data).replace(/Z$/i, '');
		svg.append('path')
			.attr('fill', 'none')
			.attr('stroke-width', 1)
			.attr('stroke-linecap', 'round')
			.attr('stroke-linejoin', 'round')
			.attr('stroke-opacity', 0.5)
			.attr('stroke', groupColors[groupNames.indexOf(group)])
			.attr('d', lineData);
	});

	// Draw the legend.
	var xPositionLegend = 0;
	yPosition = -margin.top + dataTrackHeight * 2;
	svg.append('text')
		.attr('x', xPositionLegend)
		.attr('y', yPosition)
		.attr('font-weight', '700')
		.attr('font-size', '12px')
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'bottom')
		.text('Legend');
	yPosition += dataTrackHeight;
	svg.append('text')
		.attr('x', -marginBetweenMainParts / 2)
		.attr('y', yPosition + dataTrackHeight / 2)
		.attr('text-anchor', 'end')
		.attr('alignment-baseline', 'middle')
		.text('groups');
	$.each(groupNames, function(index, value) {
		value = value ? value : 'null';
		var textWidth = calculateTextWidth(value, '10px arial');
		svg.append('rect')
			.attr('fill', groupColors[index])
			.attr('x', xPositionLegend)
			.attr('y', yPosition + Math.floor(dataTrackHeight / 2) - legendRectHeight / 2)
			.attr('width', legendRectWidth)
			.attr('height', legendRectHeight);
		svg.append('text')
			.attr('x', legendRectWidth + 5 + xPositionLegend)
			.attr('y', yPosition + dataTrackHeight / 2)
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'middle')
			.text(value);
		xPositionLegend += textWidth + 2 * legendRectWidth + 5;
	});
	yPosition += dataTrackHeight + dataTrackSeparator;
	var addStats = true;
	if (addStats) {
		svg.append('text')
			.attr('x', -marginBetweenMainParts / 2)
			.attr('y', yPosition + dataTrackHeight / 2)
			.attr('text-anchor', 'end')
			.attr('alignment-baseline', 'middle')
			.text('statistics');
		var statsLegend = ['p >= 0.05', '* p < 0.05', '** p < 0.01', '*** p < 0.001'];
		xPositionLegend = 0;
		$.each(statsLegend, function(i, v) {
			var statsTextColor = v === 'p >= 0.05' ? textColorLight : textColor;
			var textWidth = calculateTextWidth(v, '10px arial');
			svg.append('text')
				.attr('fill', statsTextColor)
				.attr('x', xPositionLegend)
				.attr('y', yPosition + dataTrackHeight / 2)
				.attr('text-anchor', 'start')
				.attr('alignment-baseline', 'middle')
				.text(v);
			xPositionLegend += textWidth + 5 * sampleWidth + 5;
		});
	}

	// Draw a horizontal line under the legend to separate it better from the actual data.
	svg.append('line')
		.attr('x1', -margin.left)
		.attr('y1', Math.round(yPosition + dataTrackHeight + marginBetweenMainParts))
		.attr('x2', linePlotWidth + margin.right)
		.attr('y2', Math.round(yPosition + dataTrackHeight + marginBetweenMainParts))
		.attr('class', 'legend-separator')
		.attr('stroke', textColorLight);
	$('.plot-loader').hide();
};

var resetClinicalParameters = function() {
	$('.parameters-options li').each(function() {
		var parameter = $(this).attr('data-value');
		if (cancerTypeAnnotation.default.indexOf(parameter) !== -1) {
			$(this).addClass('selected');
		} else {
			$(this).removeClass('selected');
		}
	});
};

var setToolbar = function(type) {
	if (type === 'detail') {
		$('.toolbar').find('li').each(function() {
			if ($(this).hasClass('toolbar-detail')) {
				$(this).css('display', 'inline-block');
			} else if ($(this).hasClass('toolbar-summary')) {
				$(this).css('display', 'none');
			}
		});
	} else if (type === 'summary') {
		$('.toolbar').find('li').each(function() {
			if ($(this).hasClass('toolbar-summary')) {
				$(this).css('display', 'inline-block');
			} else if ($(this).hasClass('toolbar-detail')) {
				$(this).css('display', 'none');
			}
		});
	}	
};

var showDataTypeInformation = function(dataType) {
	var methylationFile = 'data/' + cancerTypeAnnotation.short_name + '/HumanMethylation450.json';
	if (cancerTypeAnnotation.short_name === 'ov') {
		methylationFile = 'data/' + cancerTypeAnnotation.short_name + '/HumanMethylation27.json';
	}
	var dataInformation = {
		'gene expression data': 'data/' + cancerTypeAnnotation.short_name + '/htseq_fpkm-uq.tsv.json',
		'mirna expression data': 'data/' + cancerTypeAnnotation.short_name + '/mirna.tsv.json',
		'cnv data': 'data/' + cancerTypeAnnotation.short_name +
			'/Gistic2_CopyNumber_Gistic2_all_thresholded.by_genes.json',
		'phenotype data': 'data/' + cancerTypeAnnotation.short_name + '/GDC_phenotype.tsv.json',
		'survival data': 'data/' + cancerTypeAnnotation.short_name + '/survival.tsv.json',
		'methylation data': methylationFile,
		'somatic mutations': 'data/' + cancerTypeAnnotation.short_name + '/mutect2_snv.tsv.json',
		'statistics': 'data/statistics.json',
		'genomic annotation': 'data/genomicAnnotation.json'
	};
	var infoWindow = $('.data-type-information').find('.data-type-information__content');
	infoWindow.empty();
	$.getJSON(
		dataInformation[dataType]
	).done(function(data) {
		infoWindow.append('<h2>' + dataType + '</h2>');
		$.each(data, function(key, value) {
			infoWindow.append('<p><strong>' + key + ':</strong> ' + value + '</p>');
		});
	});
	$('.data-type-information').slideDown(200);
};

var showFilterOptions = function(sampleFilter) {
	var filterWindow = $('.select-filter');
	if (sampleFilter === '') {
		clearFilterSelection();
	} else {
		if (sampleFilter in cancerTypeDataFiltered) {
			dataToFilter = cancerTypeDataFiltered[sampleFilter];
		} else if (sampleFilter in cancerTypeDataFiltered.phenotype) {
			dataToFilter = cancerTypeDataFiltered.phenotype[sampleFilter];
		} else {
			console.log('ERROR: cannot find "' + sampleFilter + '" in the data object keys.');
			$('.toolbar--select-filter option').first().prop('selected', true);
			clearFilterSelection();
			return false;
		}
	}
	clearFilterSelection();
	var filterOptions, dataSummaryText;
	var dataValues = Object.values(dataToFilter);
	if (sampleFilter === 'dna_methylation_data') {
		dataSummaryText = '<span class="filter-tip">Select a value</span>' +
			'<ul class="summary-values filter-list list-border">' +
			'<input type="text">' +
			'<li data-summary-variable="null" data-value="null">null</li>' +
			'</ul>';
		$('.filter-value-container').empty();
		filterWindow.find('.data-summary').append(dataSummaryText);
		filterOptions = '<span class="filter-tip">Select an operator</span>' +
			'<ul class="filter-options filter-list list-border">' +
			'<li data-value="ne">&ne;&emsp;not equal to</li>' +
			'</ul>';
	} else if (parameterIsNumerical(dataValues)) {
		// Add a summary of the data and plot the data distribution so the user can more easily
		// select an appropriate filter value.
		var dataSummary;
		if (sampleFilter === 'cnv') {
			// We don't want to add the quantiles for the copy number data.
			dataSummary = summary(dataValues, false);
		} else {
			dataSummary = summary(dataValues, true);
		}
		dataSummaryText = '<span class="filter-tip">Select a value</span>' +
			'<ul class="summary-values filter-list list-border">' +
			'<input type="text">';
		$.each(dataSummary, function(key, value) {
			var summaryVariable = key.replace(/ /g, '-');
			summaryVariable = summaryVariable.replace(/%/, '');
			if (key === 'null') {
				var nrSamples = $('.nr_samples').text();
				var nullCount = nrSamples - dataValues.length + value;
				dataSummaryText += '<li data-summary-variable="null" data-value="null">null&emsp;' +
					nullCount + '/' + nrSamples + '</li>';
			} else {
				dataSummaryText += '<li data-summary-variable="' + summaryVariable +
					'" data-value="' + value + '">' + key + '&emsp;' +
					(Math.round(value * 1000) / 1000) + '</li>';
			}
		});
		dataSummaryText += '</ul>';
		filterWindow.find('.data-summary').append(dataSummaryText);
		drawHistogram(dataValues, '.select-filter .data-summary');
		$('.filter-value-container').empty();
		filterOptions = '<span class="filter-tip">Select an operator</span>' +
						'<ul class="filter-options filter-list list-border">' +
						'<li data-value="lt">&lt;&emsp;less than</li>' +
						'<li data-value="le">&le;&emsp;less than or equal to</li>' +
						'<li data-value="eq">=&emsp;equal to</li>' +
						'<li data-value="ne">&ne;&emsp;not equal to</li>' +
						'<li data-value="ge">&ge;&emsp;greater than or equal to</li>' +
						'<li data-value="gt">&gt;&emsp;greater than</li>' +
						'</ul>';

	} else {
		//filterWindow.find('.data-summary').append('Data bar plot:');
		drawBarPlot(dataValues, '.select-filter .data-summary');
		$('.filter-value-container').empty()
			.append('<span class="filter-tip">Select values</span><ul class="filter-categories filter-list list-border"></ul>');
		var categories = dataValues.filter(uniqueValues).sort(sortAlphabetically);
		$.each(categories, function(index, value) {
			$('.filter-categories').append('<li data-value="' + value + '">' + value + '</li>');
		});
		filterOptions = '<span class="filter-tip">Select an operator</span>' +
						'<ul class="filter-options filter-list list-border">' +
						'<li data-value="eq">=&emsp;equal to</li>' +
						'<li data-value="ne">&ne;&emsp;not equal to</li>' +
						'</ul>';
	}
	$('.filter-options-container').empty().append(filterOptions);
};

var showWindow = function(elementClass) {
	$(elementClass).slideDown(200);
};

var sortAlphabetically = function(a,b) {
	if (a === b) {
		return 0;
	} else if (a === null) {
		return 1;
	} else if (b === null) {
		return -1;
	} else {
		return a < b ? -1 :  1;
	}
};

var sortSamples = function(samples, dataToSort) {
	var dataToSortFiltered = {};
	var missingSamples = [];
	var orderedSamples;

	// First, filter the data based on the given samples.
	$.each(samples, function(index, sample) {
		if (sample in dataToSort) {
			dataToSortFiltered[sample] = dataToSort[sample];
		} else {
			missingSamples.push(sample);
		}
	});

	// Next, perform the sort on the filtered data.
	if (parameterIsNumerical(Object.values(dataToSortFiltered))) {
		// Sort the values numerically.
		orderedSamples = Object.keys(dataToSortFiltered).sort(function(a,b) {
			var valueA = makeNumeric(dataToSortFiltered[a]);
			var valueB = makeNumeric(dataToSortFiltered[b]);
			if (valueA === null) {
				return 1;
			} else if (valueB === null) {
				return -1;
			} else {
				return valueA - valueB;
			}
		});
	} else {
		// Sort the values alphabetically. Note that the values will always be lower case, so we
		// don't have to worry about making our sort function case sensitive. We will put all the
		// null values at the end of the sorted array.
		orderedSamples = Object.keys(dataToSortFiltered).sort(function(a,b) {
			var valueA = dataToSortFiltered[a];
			var valueB = dataToSortFiltered[b];
			var result;
			if (valueA === valueB) {
				result = 0;
			} else if (valueA === null) {
				result = 1;
			} else if (valueB === null) {
				result = -1;
			} else {
				result = valueA < valueB ? -1 :  1;
			}
			return result;
		});
	}
	return orderedSamples.concat(missingSamples);
};

var uniqueValues = function(value, index, self) {
	// This function returns the unique values in an array and was adapted from
	// https://stackoverflow.com/a/14438954
	return self.indexOf(value) === index;
};

var updateDropdowns = function(parameters) {
	$('.toolbar--select-filter').find('option[data-type="clinical"]').remove();
	$('.toolbar--select-sorter').find('option[data-type="clinical"]').remove();
	$.each(parameters.sort(sortAlphabetically), function(index, value) {
		var parameterText = value.replace(/_/g, ' ');
		if (parameterText.length > 35) {
			parameterText = parameterText.substr(0, 32) + '...';
		}
		$('.toolbar--select-filter').append('<option value="' + value +
			'" data-type="clinical">' + parameterText + '</option>');
		$('.toolbar--select-sorter').append('<option value="' + value +
			'" data-type="clinical">' + parameterText + '</option>');
	});
	$('.toolbar--select-filter').find('option[value="no filter"]').prop('selected', true);
	$('.toolbar--select-sorter').find('option[value="region_expression"]').prop('selected', true);
};

var variantsByStartValue = function(data) {
	var variants = {};
	$.each(data, function(sample, value) {
		$.each(value, function(index, snv) {
			snv.sample = sample;
			if (snv.start in variants) {
				variants[snv.start].push(snv);
			} else {
				variants[snv.start] = [snv];
			}
		});
	});
	return variants;
};
