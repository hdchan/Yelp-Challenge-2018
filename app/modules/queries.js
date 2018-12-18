module.exports = Object.freeze({
    
    TOP_RESTAURANT_LIST: `
    SELECT
    metrics.business_id,
    business.name,
    business.latitude,
    business.longitude
    FROM metrics
    LEFT JOIN trimmed_business AS business
    ON business.business_id = metrics.business_id
    WHERE metrics.%list_id% = 1
    ORDER BY metrics.%sort_by% DESC
    `,

    META_DATA: `
    SELECT
    metrics.business_id,
    business.name,
    business.stars AS star_metric,
    business.address,
    business.city,
    business.postal_code,
    business.state,
    business.latitude,
    business.longitude,
    metrics.variance AS variance_metric,
    metrics.funnynorm AS funny_metric, 
    metrics.usefulnorm AS useful_metric,
    metrics.coolnorm AS cool_metric,
    metrics.normcheckins AS checkin_metric,
    rating_distribution."1_star",
    rating_distribution."2_star",
    rating_distribution."3_star",
    rating_distribution."4_star",
    rating_distribution."5_star"
    FROM metrics
    LEFT JOIN rating_distribution
    ON rating_distribution.business_id = metrics.business_id
    LEFT JOIN trimmed_business AS business
    ON business.business_id = metrics.business_id
    WHERE metrics.business_id = "%business_id%"
    LIMIT 1
    `,

    COMMENTS: `
    SELECT 
    review_id,
    text,
    stars
    FROM comments
    WHERE business_id = "%business_id%"
    ORDER BY stars DESC
    `,

    WORD_GRAPH: `
    SELECT 
    review_id,
    trim(lower(word)) AS target,
    sentiment_score,
    rating || "_star" AS source
    FROM wordgraph
    WHERE business_id = "%business_id%"
    `
})