// Function definitions.
//
var addClinicalParameters = function() {
	var parametersList = $('.parameters-options');
	parametersList.empty();
	$.each(cancerTypeAnnotation.phenotype, function(index, value) {
		parametersList.append('<li data-value="' + value + '">' + value.replace(/_/g, ' ') +
			'</li>');
		if (cancerTypeAnnotation.default.indexOf(value) !== -1) {
			parametersList.find('li').last().addClass('selected');
		}
	});
};

var addProbeAnnotation = function(probeId, annotation, xPosition, yPosition) {
	svg.append('rect')
		.attr('fill', missingValueColor)
		.attr('x', xPosition - 5)
		.attr('y', yPosition)
		.attr('width', 180 - marginBetweenMainParts)
		.attr('height', 11 * Object.keys(annotation).length + 10)
		.attr('class', 'probe-annotation');
	var counter = 1;
	svg.append('text')
			.attr('x', xPosition)
			.attr('y', yPosition + counter * 10) // the font size is 9px
			.attr('font-size', '9px')
			.attr('fill', textColor)
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'baseline')
			.attr('class', 'probe-annotation')
			.text('probe ID: ' + probeId);
	$.each(annotation, function(key, value) {
		counter += 1;
		svg.append('text')
			.attr('x', xPosition)
			.attr('y', yPosition + counter * 10) // the font size is 9px
			.attr('font-size', '9px')
			.attr('fill', textColor)
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'baseline')
			.attr('class', 'probe-annotation')
			.text(key.replace(/_/g, ' ') + ': ' + value);
	});
};

var addVariantAnnotation = function(annotation, x, y) {
	annotation = annotation.split('__');
	var maxTextWidth = 0;
	$.each(annotation, function(index, value) {
		var textWidth = calculateTextWidth(value, '9px arial');
		maxTextWidth = textWidth > maxTextWidth ? textWidth : maxTextWidth;
	});
	svg.append('rect')
		.attr('fill', missingValueColor)
		.attr('x', x + 5)
		.attr('y', y)
		.attr('width', maxTextWidth + 2 * 5) // 2 * 5 = margin around text
		.attr('height', 11 * annotation.length)
		.attr('class', 'variant-annotation');
	var counter = 0;
	$.each(annotation, function(index, value) {
		counter += 1;
		var annotationText;
		if (value.startsWith('sample:')) {
			// We don't want to replace the underscores in the sample names.
			annotationText = value;
		} else {
			annotationText = value.replace(/_/g, ' ');
		}
		svg.append('text')
			.attr('x', x + 10)
			.attr('y', y + counter * 10) // the font size is 9px
			.attr('font-size', '9px')
			.attr('fill', textColor)
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'baseline')
			.attr('class', 'variant-annotation')
			.text(annotationText);
	});
};

var addToolbar = function() {
	// Reset the toolbar.
	$('.toolbar .data-summary').empty()
		.append('<p><strong>' + cancerTypeData.region_annotation.name + '</strong> &mdash; ' +
			cancerTypeAnnotation.full_name + '</p>')
		.append('<p>Showing data for <span class="nr_samples"></span> samples.</p>');
	$('.toolbar--select-sorter option:not(:first)').remove();
	$('.toolbar--select-filter option:not(:first)').remove();
	$('.toolbar--select-data-type option[value=cnv]').attr('disabled', false);

	// Add the available variables to the 'sorter' select dropdown. Here, the user can choose to
	// reorder the samples by any of the available variables.
	$('.toolbar--select-filter').append('<option value="region_expression">expression</option>');
	if (Object.keys(cancerTypeData.cnv).length) {
		$('.toolbar--select-filter').append('<option value="cnv">copy number</option>');
		$('.toolbar--select-sorter').append('<option value="cnv">copy number</option>');
	} else {
		$('.toolbar--select-data-type option[value=cnv]').attr('disabled', true);
	}
	$.each(cancerTypeAnnotation.default.sort(sortAlphabetically), function(index, value) {
		var parameterText = value.replace(/_/g, ' ');
		if (parameterText.length > 40) {
			parameterText = parameterText.substr(0, 37) + '...';
		}
		$('.toolbar--select-filter').append('<option value="' + value + '" data-type="clinical">' +
			parameterText + '</option>');
		$('.toolbar--select-sorter').append('<option value="' + value + '" data-type="clinical">' +
			parameterText + '</option>');
	});
	$('.toolbar').animate({
		opacity: 1
	}, 500);
};

var calculateStatistics = function(samples, sorter) {
	var stats = {};
	var sorterValues = [];
	if (sorter === 'region_expression') {
		$.each(samples, function(index, sample) {
			var dataValue = cancerTypeData.region_expression[sample];
			if (dataValue !== null) {
				sorterValues.push(+dataValue);
			} else {
				sorterValues.push(null);
			}
		});

		// We need to calculate the correlation with DNA methylation and numerical clinical
		// variables, and perform a t-test or ANOVA for categorical clinical variables.
		stats.dna_methylation_data = {};
		$.each(cancerTypeData.dna_methylation_data, function(key, value) {
			methylationValues = [];
			$.each(samples, function(index, sample) {
				var dataValue = value[sample];
				if (dataValue !== null) {
					methylationValues.push(+dataValue);
				} else {
					methylationValues.push(null);
				}
			});
			stats.dna_methylation_data[key] = pearsonCorrelation(sorterValues, methylationValues);
		});
	} else if (sorter === 'cnv') {
		//
	} else if (sorter in cancerTypeData.phenotype) {
		//
	} else {
		//
	}
	return stats;
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
	filterParent.find('.sample-filter').text('');
	filterParent.find('.filter-categories').remove();
	filterParent.find('input[type=text]').remove();
	filterParent.find('.data-summary').empty();
	$('.filter-options').empty();
	$('.button--filter').addClass('button--inactive');
	//$('.toolbar--select-filter')[0].selectedIndex = 0;
};

var drawArrow = function(y, xPosition, annotation, color) {
	// Add an arrow to indicate whether the region is located on the + or - strand.
	svg.append('path')
		.attr('d', function(d) {
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
		barPlotSvg.append('rect')
			.attr('fill', histogramColor)
			.attr('x', 0)
			.attr('y', y(index))
			.attr('width', x(dataTable[value]))
			.attr('height', dataTrackHeight);
		barPlotSvg.append('text')
			.attr('x', -5)
			.attr('y', y(index) + dataTrackHeight / 2)
			.attr('font-size', '11px')
			.attr('fill', histogramColor)
			.attr('text-anchor', 'end')
			.attr('alignment-baseline', 'middle')
			.text(value + ' (' + dataTable[value] + '/' + data.length + ')');
	});
};

var drawCoordinates = function(y) {
	var coordinates = [];
	coordinates.push(Math.floor(cancerTypeData.region_annotation.start / 1000) * 1000);
	coordinates.push(Math.ceil(cancerTypeData.region_annotation.end / 1000) * 1000);
	coordinates.push(coordinates[0] +
		Math.round(Math.abs(coordinates[0] - coordinates[1]) / 2000) * 1000);
	$.each(coordinates, function(index, value) {
		svg.append('text')
			.attr('x', 0)
			.attr('y', y(value))
			.attr('fill', textColor)
			.attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'baseline')
			.attr('transform', 'rotate(-90, ' + 0 + ',' + y(value) + ')')
			.text(value);
		svg.append('line')
			.attr('x1', genomicFeatureLargeMargin)
			.attr('x2', genomicFeatureLargeMargin + genomicCoordinatesWidth)
			.attr('y1', y(value))
			.attr('y2', y(value))
			.attr('stroke', textColor);
	});
};

var drawDataTrack = function(data, sortedSamples, color, xPosition, yPosition, variable) {
	var dataValues = [];
	$.each(sortedSamples, function(index, sample) {
		if (sample in data) {
			dataValues.push(data[sample]);
		} else {
			dataValues.push(null);
		}
	});
	if (parameterIsNumerical(dataValues)) {
		dataValues = dataValues.map(makeNumeric);
		var factor = Math.max.apply(Math, dataValues) / dataTrackHeight;
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
		var allCategories = Object.values(data).filter(uniqueValues);
		allCategories.sort(sortAlphabetically);
		var re = new RegExp('^(clinical|pathologic)_|tumor_stage_*|clinical_stage_');
		var categoryColors;
		if (re.test(variable)) {
			categoryColors = dataValues.map(function(x) {
				if (x) {
					if (variable.endsWith('simplified')) {
						return stageColorsSimplified[allCategories.indexOf(x)];
					} else {
						return stageColors[allCategories.indexOf(x)];
					}
				} else {
					return missingValueColor;
				}
			});
		} else {
			categoryColors = dataValues.map(function(x) {
				if (x) {
					return categoricalColors[allCategories.indexOf(x)];
				} else {
					return missingValueColor;
				}
			});
		}
		$.each(dataValues, function(index, value) {
			svg.append('rect')
				.attr('fill', categoryColors[index])
				.attr('x', xPosition + sampleWidth * index)
				.attr('y', yPosition)
				.attr('width', sampleWidth)
				.attr('height', dataTrackHeight);
		});
	}
	if (variable) {
		var parameterText = variable.replace(/_/g, ' ');
		if (parameterText.length > 40) {
			parameterText = parameterText.substr(0, 37) + '...';
		}
		svg.append('text')
			.attr('x', xPosition - marginBetweenMainParts / 2)
			.attr('y', yPosition + dataTrackHeight / 2)
			.attr('font-size', '9px')
			.attr('fill', textColor)
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
		.attr('font-size', '9px')
		.attr('fill', textColor)
		.attr('text-anchor', 'end')
		.attr('alignment-baseline', 'middle')
		.text('copy number');
};

var drawDataTrackVariants = function(data, sortedSamples, variantPosition, xPosition, yPosition) {
	var dataValues = [];
	$.each(sortedSamples, function(index, sample) {
		if (sample in data) {
			// There can be more than one variant per sample, so we need to make sure we have the
			// correct one (by filtering on genomic location).
			var sampleVariant = data[sample].filter(function(x) {
				return x.start == variantPosition;
			});
			if (sampleVariant.length) {
				dataValues.push(sampleVariant[0]);
			} else {
				dataValues.push(null);
			}
		} else {
			dataValues.push(null);
		}
	});
	var variantCategories = getVariantCategories(cancerTypeData.snv);
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
						var xPosition = Number($(this).attr('cx'));
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
	var y = d3.scaleLinear().domain([0, Math.max.apply(Math, histogramDataCounts)])
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
			.style('stroke', '#ff6666')
			.style('stroke-opacity', 0)
			.attr('stroke-width', 2);
	});
};

var filterSamples = function(sampleFilter) {
	if (sampleFilter === null) {
		return allSamples;
	} else {
		sampleFilter = sampleFilter.split('__');
		var parameterToFilter = sampleFilter[0];
		var filterCommand = sampleFilter[1];
		var filterValues = sampleFilter[2].split('+');
		var dataToFilter;
		if (parameterToFilter in cancerTypeData) {
			dataToFilter = cancerTypeData[parameterToFilter];
		} else if (parameterToFilter in cancerTypeData.phenotype) {
			dataToFilter = cancerTypeData.phenotype[parameterToFilter];
		} else {
			console.log('ERROR: cannot find "' + parameterToFilter + '" in the data object keys.');
			return false;
		}
		var filteredSamples = allSamples.filter(function(sample) {
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
			console.log(cancerTypeData);
			addToolbar();
			addClinicalParameters();

			// By default, the samples are not filtered and are sorted by the expression of the
			// selected main region.
			plot('region_expression', null, false);
		} else {
			$('.plot-window > svg').remove();
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

var plot = function(sorter, sampleFilter, showVariants) {
	$('.plot-window > svg').remove();

	// The plot consists of three main parts:
	// 1. genomic annotation data (miRNAs, genes, transcripts, CpG islands)
	// 2. location-linked data (DNA methylation and variants)
	// 3. sample-linked data (expression, copy number variation, clinical data)
	// In order to draw an accurate plot we need to count:
	// - the number of samples
	// - the number of genomic features/regions
	// -=> will determine the width of the plot
	// - the number of clinical parameters
	// - the number of location-linked data tracks
	// -=> will determine the height of the plot
	//
	// Count the number of regions (including transcripts in the case of genes) that need to be
	// drawn.
	var nrOtherGenes = cancerTypeData.other_regions.filter(isRegion('gene')).length;
	var nrTranscripts = 0;
	if (cancerTypeData.region_annotation.region_type === 'gene') {
		nrTranscripts = Object.keys(cancerTypeData.region_annotation.transcripts).length;
	}
	var nrOtherTranscripts = 0;
	$.each(cancerTypeData.other_regions.filter(isRegion('gene')), function(key, value) {
		nrOtherTranscripts += Object.keys(value.transcripts).length;
	});
	var nrOtherMirnas = cancerTypeData.other_regions.filter(isRegion('mirna')).length;
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
	clinicalParameters = $('#clinical-parameters').text();
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
	// need to be shown).
	var categoricalClinicalParameters = clinicalParameters.filter(function(a) {
		return !parameterIsNumerical(Object.values(cancerTypeData.phenotype[a]));
	});
	var legendHeight = 0;
	legendHeight = categoricalClinicalParameters.length * (dataTrackHeight + dataTrackSeparator);
	var legendWidth = 0;
	$.each(categoricalClinicalParameters, function(index, value) {
		var categoryData = Object.values(cancerTypeData.phenotype[value]);
		var categories = categoryData.filter(uniqueValues);
		var categoryWidth = 0;
		$.each(categories, function(i, v) {
			v = v ? v : 'null';
			var textWidth = calculateTextWidth(v.replace(/_/g, ' '), '9px arial');
			categoryWidth += textWidth + 2 * legendRectWidth + 5;
		});
		if (categoryWidth > legendWidth) {
			legendWidth = categoryWidth;
		}
	});
	var variantCategories;
	if (showVariants) {
		legendHeight += dataTrackHeight + dataTrackSeparator;
		variantCategories = getVariantCategories(cancerTypeData.snv);
		var variantCategoriesWidth = 0;
		$.each(variantCategories, function(i, v) {
			v = v ? v : 'null';
			var textWidth = calculateTextWidth(v.replace(/_/g, ' '), '9px arial');
			variantCategoriesWidth += textWidth + 2 * legendRectWidth + 5;
		});
		if (variantCategoriesWidth > legendWidth) {
			legendWidth = variantCategoriesWidth;
		}
	}

	// Count the number of location-linked data tracks that need to be plotted. These include the
	// tracks for the DNA methylation data (one track per probe), as well as the variant data (one
	// track per variant).
	var nrDnaMethylationTracks = 0;
	nrDnaMethylationTracks += Object.keys(cancerTypeData.dna_methylation_data).length;
	var variants = showVariants ? variantsByStartValue(cancerTypeData.snv) : {};
	var nrVariantTracks = Object.keys(variants).length;

	// Calculate the amount of vertical space that is needed to plot all the data tracks. All the
	// phenotype and expression data will be plotted in the top margin. This way we can have the y
	// axis represent genomic coordinates and we don't have to worry about mapping the phenotype
	// and expression tracks to a genomic location.
	var topMargin = legendHeight +
					marginBetweenMainParts + // Margin between the legend and the data tracks.
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
	
	// Count the number of samples.
	var dnaMethylationSamples = 0;
	if (cancerTypeData.dna_methylation_data.length) {
		var dnaMethProbe = Object.keys(cancerTypeData.dna_methylation_data)[0];
		dnaMethylationSamples = Object.keys(cancerTypeData.dna_methylation_data[dnaMethProbe]);
	}
	var regionExpressionSamples = Object.keys(cancerTypeData.region_expression);
	var phenotypeVariable = Object.keys(cancerTypeData.phenotype)[0];
	var phenotypeSamples = Object.keys(cancerTypeData.phenotype[phenotypeVariable]);
	var cnvSamples = 0;
	if (cancerTypeData.cnv.length) {
		cnvSamples = Object.keys(cancerTypeData.cnv);
	}

	// Create an array that holds all the samples for which there is any type of data. This array
	// will be used to sort the samples by whichever variable the user chooses. It will also be
	// used to filter the data (e.g. to show only primary tumor samples).
	allSamples = merge(dnaMethylationSamples, regionExpressionSamples, phenotypeSamples,
		cnvSamples);

	// Filter the samples. By default, there is no filtering applied.
	var samples = filterSamples(sampleFilter);

	// Sort the samples by the selected variable.
	var dataToSort;
	if (!sorter) {
		sorter = 'region_expression';
	}
	if (sorter in cancerTypeData) {
		dataToSort = cancerTypeData[sorter];
		samples = sortSamples(samples, dataToSort);
	} else if (sorter in cancerTypeData.phenotype) {
		dataToSort = cancerTypeData.phenotype[sorter];
		samples = sortSamples(samples, dataToSort);
	}

	// Calculate the necessary statistics (correlation, t-test, ANOVA) for the sorter. If for
	// example the samples are sorted by their region expression, then all statistics will be
	// calculated based on the expression data, i.e. correlation between expression and DNA
	// methylation, correlation between expression and numerical clinical parameters, t-test or
	// ANOVA comparing expression in different groups for categorical clinical parameters.
	var stats = calculateStatistics(samples, sorter);
	console.log('STATS OBJECT:');
	console.log(stats);

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
	var margin = {top: 20 + topMargin, left: 40, bottom: 100, right: 200};
	var x = d3.scaleLinear().domain([0, width]).range([0, width]);
	var y = d3.scaleLinear().domain([cancerTypeData.plot_data.start, cancerTypeData.plot_data.end])
		.range([0, locationLinkedTracksHeight]);
	svg = d3.select('.plot-window')
		.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', locationLinkedTracksHeight + margin.top + margin.bottom)
			.attr('text-rendering', 'geometricPrecision')
			.attr('font-family', 'arial')
			.attr('font-size', '9px')
			.attr('fill', textColor)
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
	$.each(cancerTypeData.probe_annotation_450, function(key, value) {
		var yPosition = value.cpg_location;
		probeLocations.push(yPosition);
		var nrVariants = 0;
		if (showVariants) {
			// We need to leave enough room to plot the genomic variants.
			nrVariants = Object.keys(variants).filter(function(x) {
				return x < yPosition;
			}).length;
		}
		var yPositionDataTrack = marginBetweenMainParts +
								 probeCounter * (dataTrackHeight + dataTrackSeparator) +
								 nrVariants * (dataTrackHeightVariants + dataTrackSeparator) +
								 dataTrackHeight / 2;
		if (yPosition < cancerTypeData.plot_data.end && yPosition > cancerTypeData.plot_data.start) {
			// Draw the horizontal part of the line.
			svg.append('line')
				.attr('x1', xPosition)
				.attr('x2', genomicFeaturesWidth)
				.attr('y1', y(yPosition))
				.attr('y2', y(yPosition))
				.attr('class', key)
				.style('stroke', probeLineColor)
				.attr('stroke-width', 1);

			// Draw the sloped line that connects the DNA methylation data track with the probe
			// location.
			svg.append('line')
				.attr('x1', genomicFeaturesWidth)
				.attr('x2', genomicFeaturesWidth + marginBetweenMainParts * 5)
				.attr('y1', y(yPosition))
				.attr('y2', yPositionDataTrack)
				.attr('class', key)
				.attr('stroke', probeLineColor)
				.attr('stroke-width', 1);
			probeCounter += 1;
		}
	});

	// Draw the lines that connect the genomic locations of the genomic variants with their
	// corresponding data tracks.
	var variantCounter = 0;
	if (showVariants) {
		$.each(variants, function(position, snv) {
			var nrProbes = probeLocations.filter(function(x) {
				return x < position;
			}).length;
			var yPositionDataTrack = marginBetweenMainParts +
									 variantCounter * (dataTrackHeightVariants + dataTrackSeparator) +
									 nrProbes * (dataTrackHeight + dataTrackSeparator) +
									 dataTrackHeightVariants / 2;
			if (position < cancerTypeData.plot_data.end && position > cancerTypeData.plot_data.start) {
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

				// Add an extra horizontal line to visually separate the different variants.
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
	drawCoordinates(y);

	// Draw the individual CpGs and the CpG islands.
	var regionSequence = cancerTypeData.region_annotation.sequence;
	var re = /CG/g;
	var cpgPosition, cpgOpacity = 1;
	while ((match = re.exec(regionSequence)) !== null) {
		cpgPosition = cancerTypeData.region_annotation.start + match.index;

		// Adapt the opacity of the CpG lines to the length of the gene. Otherwise the CpG plot is
		// just one big block of green for extremely long genes. Since the longest genes in the
		// human genome appear to be around 2.3 megabases long, we chose 2,500,000 as the
		// denominator in the calculation below (basically to normalise the gene length to a value
		// between 0 and 1).
		cpgOpacity = 1 - Math.abs(cancerTypeData.region_annotation.start -
			cancerTypeData.region_annotation.end) / 2500000;
		if (cpgPosition > cancerTypeData.plot_data.start && cpgPosition < cancerTypeData.plot_data.end) {
			svg.append('line')
				.attr('x1', xPosition)
				.attr('x2', xPosition + cpgWidth)
				.attr('y1', y(cpgPosition))
				.attr('y2', y(cpgPosition))
				.style('stroke', cpgColor)
				.style('stroke-opacity', cpgOpacity)
				.attr('stroke-width', 1);
		}
	}
	xPosition += cpgWidth + genomicFeatureSmallMargin;
	$.each(cancerTypeData.cpgi_annotation, function(key, value) {
		var regionStart, regionEnd;
		regionStart = value.start;
		regionEnd = value.end;
		if (regionStart < cancerTypeData.plot_data.start) {
			regionStart = cancerTypeData.plot_data.start;
		} else if (regionEnd > cancerTypeData.plot_data.end) {
			regionEnd = cancerTypeData.plot_data.end;
		}
		svg.append('rect')
			.attr('fill', cpgColor)
			.attr('x', xPosition)
			.attr('y', y(regionStart))
			.attr('width', cpgIslandWidth)
			.attr('height', Math.abs(y(regionStart) - y(regionEnd)));
	});
	xPosition += cpgIslandWidth + genomicFeatureLargeMargin;

	// Plot any other regions (miRNAs and/or genes with their transcripts).
	var transcripts;
	$.each(cancerTypeData.other_regions, function(key, value) {
		var regionStart, regionEnd, regionName;
		xPosition += genomicFeatureLargeMargin;
		regionStart = value.start;
		regionEnd = value.end;
		if (regionStart < cancerTypeData.plot_data.end && regionEnd > cancerTypeData.plot_data.start) {
			if (regionStart < cancerTypeData.plot_data.start) {
				regionStart = cancerTypeData.plot_data.start;
			}
			if (regionEnd > cancerTypeData.plot_data.end) {
				regionEnd = cancerTypeData.plot_data.end;
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
						.attr('font-size', '9px')
						.attr('stroke-width', 4)
						.attr('stroke', '#fff')
						.attr('text-anchor', 'start')
						.attr('alignment-baseline', 'baseline')
						.attr('class', 'other-region-annotation')
						.text(regionName);
					svg.append('text')
						.attr('x', xPositionRegion)
						.attr('y', yPositionRegion - 5)
						.attr('font-size', '9px')
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
			drawArrow(y, xPosition, value, otherRegionColor);
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
				if (transcriptStart < cancerTypeData.plot_data.end && transcriptEnd > cancerTypeData.plot_data.start) {
					if (transcriptStart < cancerTypeData.plot_data.start) {
						transcriptStart = cancerTypeData.plot_data.start;
					} else if (transcriptEnd > cancerTypeData.plot_data.end) {
						transcriptEnd = cancerTypeData.plot_data.end;
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
	svg.append('rect')
		.attr('fill', regionColor)
		.attr('x', xPosition)
		.attr('y', y(cancerTypeData.region_annotation.start))
		.attr('width', regionWidth)
		.attr('height', Math.abs(y(cancerTypeData.region_annotation.start) -
			y(cancerTypeData.region_annotation.end)));
	svg.append('text')
		.attr('x', xPosition)
		.attr('y', y(cancerTypeData.region_annotation.start) - 5)
		.attr('font-weight', 700)
		.attr('fill', regionColor)
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'baseline')
		.text(cancerTypeData.region_annotation.name);
	xPosition += regionWidth;
	drawArrow(y, xPosition - regionWidth, cancerTypeData.region_annotation, regionColor);
	if (cancerTypeData.region_annotation.region_type === 'gene') {
		// Add the transcripts.
		transcripts = cancerTypeData.region_annotation.transcripts;
		$.each(transcripts, function(key, value) {
			var transcriptStart, transcriptEnd, exons;
			xPosition += genomicFeatureSmallMargin;
			transcriptStart = value.start;
			transcriptEnd = value.end;
			if (transcriptStart < cancerTypeData.plot_data.start) {
				transcriptStart = cancerTypeData.plot_data.start;
			} else if (transcriptEnd > cancerTypeData.plot_data.end) {
				transcriptEnd = cancerTypeData.plot_data.end;
			}
			svg.append('rect')
				.attr('fill', transcriptColor)
				.attr('x', xPosition)
				.attr('y', y(transcriptStart))
				.attr('width', transcriptWidth)
				.attr('height', Math.abs(y(transcriptStart) - y(transcriptEnd)));
			exons = value.exons;
			$.each(exons, function(key, value) {
				var exonStart, exonEnd;
				exonStart = value.start;
				exonEnd = value.end;
				if (exonStart < cancerTypeData.plot_data.start) {
					exonStart = cancerTypeData.plot_data.start;
				} else if (exonEnd > cancerTypeData.plot_data.end) {
					exonEnd = cancerTypeData.plot_data.end;
				}
				svg.append('rect')
					.attr('fill', exonColor)
					.attr('x', xPosition)
					.attr('y', y(exonStart))
					.attr('width', transcriptWidth)
					.attr('height', Math.abs(y(exonStart) - y(exonEnd)));
			});
			xPosition += transcriptWidth;
		});
	}
	xPosition += genomicFeatureLargeMargin;

	// Draw the legend.
	xPosition += marginBetweenMainParts * 5;
	var yPosition = -topMargin;
	$.each(categoricalClinicalParameters, function(index, value) {
		svg.append('text')
			.attr('x', xPosition - marginBetweenMainParts / 2)
			.attr('y', yPosition + dataTrackHeight / 2)
			.attr('fill', textColor)
			.attr('text-anchor', 'end')
			.attr('alignment-baseline', 'middle')
			.text(value.replace(/_/g, ' '));
		var categories = Object.values(cancerTypeData.phenotype[value]).filter(uniqueValues);
		categories.sort(sortAlphabetically);
		var re = new RegExp('^(clinical|pathologic)_|tumor_stage_*|clinical_stage_');
		var categoryColors;
		if (re.test(value)) {
			categoryColors = categories.map(function(x) {
				if (x) {
					if (value.endsWith('simplified')) {
						return stageColorsSimplified[categories.indexOf(x)];
					} else {
						return stageColors[categories.indexOf(x)];
					}
				} else {
					return missingValueColor;
				}
			});
		} else {
			categoryColors = categories.map(function(x) {
				if (x) {
					return categoricalColors[categories.indexOf(x)];
				} else {
					return missingValueColor;
				}
			});
		}
		var xPositionLegend = 0;
		$.each(categories, function(i, v) {
			v = v ? v : 'null';
			var textWidth = calculateTextWidth(v.replace(/_/g, ' '), '9px arial');
			svg.append('rect')
				.attr('fill', categoryColors[i])
				.attr('x', xPosition + xPositionLegend)
				.attr('y', yPosition + Math.floor(dataTrackHeight / 2) - legendRectHeight / 2)
				.attr('width', legendRectWidth)
				.attr('height', legendRectHeight);
			svg.append('text')
				.attr('x', xPosition + legendRectWidth + 5 + xPositionLegend)
				.attr('y', yPosition + dataTrackHeight / 2)
				.attr('fill', textColor)
				.attr('text-anchor', 'start')
				.attr('alignment-baseline', 'middle')
				.text(v.replace(/_/g, ' '));
			xPositionLegend += textWidth + 2 * legendRectWidth + 5;
		});
		yPosition += dataTrackHeight + dataTrackSeparator;
	});
	if (showVariants) {
		xPositionLegend = 0;
		svg.append('text')
			.attr('x', xPosition - marginBetweenMainParts / 2)
			.attr('y', yPosition + dataTrackHeight / 2)
			.attr('fill', textColor)
			.attr('text-anchor', 'end')
			.attr('alignment-baseline', 'middle')
			.text('genomic variants');
		var variantColors = variantCategories.map(function(x) {
			if (x) {
				return categoricalColors[variantCategories.indexOf(x)];
			} else {
				return missingValueColor;
			}
		});
		$.each(variantCategories, function(index, value) {
			value = value ? value : 'null';
			var textWidth = calculateTextWidth(value.replace(/_/g, ' '), '9px arial');
			svg.append('rect')
				.attr('fill', variantColors[index])
				.attr('x', xPosition + xPositionLegend)
				.attr('y', yPosition + Math.floor(dataTrackHeight / 2) - legendRectHeight / 2)
				.attr('width', legendRectWidth)
				.attr('height', legendRectHeight);
			svg.append('text')
				.attr('x', xPosition + legendRectWidth + 5 + xPositionLegend)
				.attr('y', yPosition + dataTrackHeight / 2)
				.attr('fill', textColor)
				.attr('text-anchor', 'start')
				.attr('alignment-baseline', 'middle')
				.text(value.replace(/_/g, ' '));
			xPositionLegend += textWidth + 2 * legendRectWidth + 5;
		});
	}

	// Draw the phenotype data.
	$.each(clinicalParameters, function(index, parameter) {
		yPosition = -topMargin + legendHeight + marginBetweenMainParts +
					 index * (dataTrackHeight + dataTrackSeparator);
		var phenotypeData = cancerTypeData.phenotype[parameter];
		drawDataTrack(phenotypeData, samples, regionColor, xPosition, yPosition, parameter);
	});

	// Draw the expression data. This includes the gene/miRNA expression and copy number variation
	// data (if available).
	// 1. Gene/miRNA expression
	yPosition += dataTrackHeight + marginBetweenMainParts;
	var regionExpressionDataValues = cancerTypeData.region_expression;
	drawDataTrack(regionExpressionDataValues, samples, regionColor, xPosition, yPosition,
		cancerTypeData.region_annotation.name + ' expression');

	// 2. Copy number variation
	yPosition += dataTrackHeight + dataTrackSeparator;
	var copyNumberDataValues = cancerTypeData.cnv;
	drawDataTrackCopyNumber(copyNumberDataValues, samples, xPosition, yPosition);

	// Draw the DNA methylation data.
	var orderedProbes = Object.keys(cancerTypeData.probe_annotation_450).sort(function(a,b) {
		return cancerTypeData.probe_annotation_450[a].cpg_location -
			cancerTypeData.probe_annotation_450[b].cpg_location;
	});
	$.each(orderedProbes, function(index, value) {
		var probeLocation = cancerTypeData.probe_annotation_450[value].cpg_location;
		var nrVariants = 0;
		if (showVariants) {
			// We need to leave enough room to plot the genomic variants.
			nrVariants = Object.keys(variants).filter(function(x) {
				return x < probeLocation;
			}).length;
		}
		var yPosition = marginBetweenMainParts +
						index * (dataTrackHeight + dataTrackSeparator) +
						nrVariants * (dataTrackHeightVariants + dataTrackSeparator);
		var methylationValues = cancerTypeData.dna_methylation_data[value];
		drawDataTrack(methylationValues, samples, otherRegionColor, xPosition, yPosition);

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
				$('.' + probeId).css({'stroke': textColor});
			})
			.on('mouseout', function() {
				var probeId = $(this).attr('id');
				if (!$('.' + probeId).hasClass('highlighted')) {
					$('.' + probeId).css({'stroke': probeLineColor});
				}
			})
			.on('mouseup', function() {
				var probeId = $(this).attr('id');
				var probeAnnotation = cancerTypeData.probe_annotation_450[probeId];
				var xPositionAnnotation = xPosition + samples.length * sampleWidth +
					marginBetweenMainParts;
				$('.probe-annotation').remove();
				if ($('.' + probeId).hasClass('highlighted')) {
					$('.' + probeId).removeClass('highlighted');
					$('.' + probeId).css({'stroke': probeLineColor});
				} else {
					$('.highlighted').css({'stroke': probeLineColor});
					$('.highlighted').removeClass('highlighted');
					$('.' + probeId).addClass('highlighted');
					$('.' + probeId).css({'stroke': textColor});
					addProbeAnnotation(probeId, probeAnnotation, xPositionAnnotation, yPosition);
				}
			});
	});

	// Draw the variant data.
	variantCounter = 0;
	if (showVariants) {
		$.each(variants, function(position, snv) {
			var nrProbes = probeLocations.filter(function(x) {
				return x < position;
			}).length;
			var yPositionDataTrack = marginBetweenMainParts +
									 variantCounter * (dataTrackHeightVariants + dataTrackSeparator) +
									 nrProbes * (dataTrackHeight + dataTrackSeparator);
			drawDataTrackVariants(cancerTypeData.snv, samples, position, xPosition, yPositionDataTrack);
			variantCounter += 1;
		});
	}

	// Add the statistics.
	var addStats = true;
	if (addStats) {
		$.each(stats.dna_methylation_data, function(probe, corr) {
			var probeIndex = orderedProbes.indexOf(probe);
			var probeLocation = cancerTypeData.probe_annotation_450[probe].cpg_location;
			var nrVariants = 0;
			if (showVariants) {
				// We need to skip any variant tracks.
				nrVariants = Object.keys(variants).filter(function(x) {
					return x < probeLocation;
				}).length;
			}
			var yPosition = marginBetweenMainParts +
							probeIndex * (dataTrackHeight + dataTrackSeparator) +
							nrVariants * (dataTrackHeightVariants + dataTrackSeparator);
			var rColor = corr.p < 0.05 ? textColor : textColorLight;
			svg.append('text')
				.attr('x', xPosition + samples.length * sampleWidth + genomicFeatureLargeMargin)
				.attr('y', yPosition + dataTrackHeight / 2)
				.attr('fill', rColor)
				.attr('text-anchor', 'start')
				.attr('alignment-baseline', 'middle')
				.text('\u03C1 = ' + corr.r.toFixed(3));
		});
	}

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

var showDataTypeInformation = function(dataType) {
	var dataInformation = {
		'gene expression': 'data/' + cancerTypeAnnotation.short_name + '/htseq_fpkm-uq.tsv.json',
		'mirna expression': 'data/' + cancerTypeAnnotation.short_name + '/mirna.tsv.json',
		'cnv': 'data/' + cancerTypeAnnotation.short_name +
			'/Gistic2_CopyNumber_Gistic2_all_thresholded.by_genes.json',
		'phenotype': 'data/' + cancerTypeAnnotation.short_name + '/GDC_phenotype.tsv.json',
		'survival': 'data/' + cancerTypeAnnotation.short_name + '/survival.tsv.json',
		'methylation 450': 'data/' + cancerTypeAnnotation.short_name + '/HumanMethylation450.json',
		'variants': 'data/' + cancerTypeAnnotation.short_name + '/mutect2_snv.tsv.json'
	};
	var infoWindow = $('.data-type-information').find('.data-type-information__content');
	infoWindow.empty();
	$.getJSON(
		dataInformation[dataType]
	).done(function(data) {
		infoWindow.append('<h2>' + dataType + ' data</h2>');
		$.each(data, function(key, value) {
			infoWindow.append('<p><strong>' + key + ':</strong> ' + value + '</p>');
		});
	});
	$('.data-type-information').fadeIn(200);
};

var showFilterOptions = function(sampleFilter) {
	var filterWindow = $('.select-filter');
	var dataToFilter;
	if (sampleFilter in cancerTypeData) {
		dataToFilter = cancerTypeData[sampleFilter];
	} else if (sampleFilter in cancerTypeData.phenotype) {
		dataToFilter = cancerTypeData.phenotype[sampleFilter];
	} else {
		console.log('ERROR: cannot find "' + sampleFilter + '" in the data object keys.');
		return false;
	}
	clearFilterSelection();
	$('.sample-filter').text(sampleFilter.replace(/_/g, ' '));
	var filterOptions;
	var dataValues = Object.values(dataToFilter);
	filterWindow.find('.data-summary').append('<h2>' + sampleFilter.replace(/_/g, ' ') + '</h2>');
	if (parameterIsNumerical(dataValues)) {
		// Add a summary of the data and plot the data distribution so the user can more easily
		// select an appropriate filter value.
		var dataSummary;
		if (sampleFilter === 'cnv') {
			// We don't want to add the quantiles for the copy number data.
			dataSummary = summary(dataValues, false);
		} else {
			dataSummary = summary(dataValues, true);
		}
		var dataSummaryText = 'Data summary: <ul class="summary-values filter-list">';
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
		dataSummaryText += '</ul> Data histogram:';
		filterWindow.find('.data-summary').append(dataSummaryText);
		drawHistogram(dataValues, '.select-filter .data-summary');
		$('<input type="text">').insertAfter('.filter-options');
		filterOptions = '<li data-value="le">&lt;&emsp;less than</li>' +
						'<li data-value="le">&le;&emsp;less than or equal to</li>' +
						'<li data-value="eq">=&emsp;equal to</li>' +
						'<li data-value="ne">&ne;&emsp;not equal to</li>' +
						'<li data-value="ge">&ge;&emsp;greater than or equal to</li>' +
						'<li data-value="gt">&gt;&emsp;greater than</li>';
	} else {
		filterWindow.find('.data-summary').append('Data bar plot:');
		drawBarPlot(dataValues, '.select-filter .data-summary');
		$('.filter-categories').remove();
		$('<ul class="filter-categories filter-list"></ul>').insertAfter('.filter-options');
		var categories = dataValues.filter(uniqueValues).sort(sortAlphabetically);
		$.each(categories, function(index, value) {
			$('.filter-categories').append('<li data-value="' + value + '">' + value + '</li>');
		});
		filterOptions = '<li data-value="eq">=&emsp;equal to</li>' +
						'<li data-value="ne">&ne;&emsp;not equal to</li>';
	}
	$('.filter-options').append(filterOptions);
	filterWindow.fadeIn(200);
};

var showParameterSelection = function() {
	var selectionWindow = $('.select-parameters');
	selectionWindow.fadeIn(200);
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
		if (parameterText.length > 40) {
			parameterText = parameterText.substr(0, 37) + '...';
		}
		$('.toolbar--select-filter').append('<option value="' + value +
			'" data-type="clinical">' + parameterText + '</option>');
		$('.toolbar--select-sorter').append('<option value="' + value +
			'" data-type="clinical">' + parameterText + '</option>');
	});
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
