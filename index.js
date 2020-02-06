/** official wgs84
 * link: https://github.com/mapbox/wgs84/blob/master/index.js
 * @type {{FLATTENING_DENOM: number, RADIUS: number, POLAR_RADIUS: (function(): number), FLATTENING: (function(): number)}}
 */
var wgs84 = {
    RADIUS: 6378137,
    FLATTENING_DENOM: 298.257223563,
    /**
     * @return {number}
     */
    FLATTENING: function () {
        return 1 / this.FLATTENING_DENOM;
    },
    /**
     * @return {number}
     */
    POLAR_RADIUS: function () {
        return this.RADIUS * (1 - this.FLATTENING());
    },

    // useful methods to wgs48
    /**
     * @return {number}
     */
    RADIUS_SQRT: function () {
        return this.RADIUS * this.RADIUS;
    },
    /**
     * @return {number}
     */
    POLAR_RADIUS_SQRT: function () {
        return this.POLAR_RADIUS() * this.POLAR_RADIUS();
    },
    /**
     * @return {number}
     */
    ECCENTRICITY2: function () {
        return (2 - this.FLATTENING()) * this.FLATTENING();
    },
    /**
     * @return {number}
     */
    ECCENTRICITY: function () {
        return Math.sqrt((this.RADIUS_SQRT() - this.POLAR_RADIUS_SQRT()) / this.RADIUS_SQRT());
    },
    /**
     * @return {number}
     */
    ECCENTRICITY_PRIME: function () {
        return Math.sqrt((this.RADIUS_SQRT() - this.POLAR_RADIUS_SQRT()) / this.POLAR_RADIUS_SQRT());
    }
};

console.log(wgs84);
console.log(wgs84.RADIUS);
console.log(wgs84.FLATTENING_DENOM);
console.log(wgs84.FLATTENING());
console.log(wgs84.POLAR_RADIUS());


LLAToECEF = function (lat, lon, alt = 0) {
    console.log(lat, lon, alt);
    var rlat = lat / 180 * Math.PI;
    var rlon = lon / 180 * Math.PI;

    var slat = Math.sin(rlat);
    var clat = Math.cos(rlat);

    var N = wgs84.RADIUS / Math.sqrt(1 - wgs84.ECCENTRICITY2() * slat * slat);

    var x = (N + alt) * clat * Math.cos(rlon);
    var y = (N + alt) * clat * Math.sin(rlon);
    var z = (N * (1 - wgs84.ECCENTRICITY2()) + alt) * slat;
    return [x, y, z];
};

ECEFToLLA = function (X, Y, Z) {
    //Auxiliary values first
    var p = Math.sqrt(X * X + Y * Y);
    var theta = Math.atan((Z * wgs84.RADIUS) / (p * wgs84.POLAR_RADIUS()));

    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);

    var num = Z + wgs84.ECCENTRICITY_PRIME() * wgs84.ECCENTRICITY_PRIME() * wgs84.POLAR_RADIUS() * sinTheta * sinTheta * sinTheta;
    var denom = p - wgs84.ECCENTRICITY() * wgs84.ECCENTRICITY() * wgs84.RADIUS * cosTheta * cosTheta * cosTheta;

    //Now calculate LLA
    var latitude = Math.atan(num / denom);
    var longitude = Math.atan(Y / X);
    var N = getN(latitude);
    var altitude = (p / Math.cos(latitude)) - N;

    if (X < 0 && Y < 0) {
        longitude = longitude - Math.PI;
    }

    if (X < 0 && Y > 0) {
        longitude = longitude + Math.PI;
    }

    return [degrees(latitude), degrees(longitude), altitude];
};

getN = function (latitude) {
    var sinlatitude = Math.sin(latitude);
    var denom = Math.sqrt(1 - wgs84.ECCENTRICITY() * wgs84.ECCENTRICITY() * sinlatitude * sinlatitude);
    var N = wgs84.RADIUS / denom;
    return N;
};

/*
 * Converts an angle in radians to degrees.
 */
degrees = function degrees(angle) {
    return angle * (180 / Math.PI);
};


// Example
var [X, Y, Z] = LLAToECEF(10, 12, 20);
console.log([X, Y, Z]);
console.log(ECEFToLLA(X, Y, Z));


/*********** Index demo Script ****************/
document.getElementById('LLAToECEF').addEventListener("click", function () {
    var lat = +document.getElementById("lat").value;
    var lon = +document.getElementById("lon").value;
    var alt = +document.getElementById("alt").value;

    var [X, Y, Z] = LLAToECEF(lat, lon, alt);

    document.getElementById("LLAToECEF_RESULT").innerHTML = `[lat = ${lat}, lon = ${lon}, alt = ${alt}]<br/>[X = ${X}, Y = ${Y}, Z = ${Z}]`;
});

document.getElementById('ECEFToLLA').addEventListener("click", function () {
    var X = +document.getElementById("x").value;
    var Y = +document.getElementById("y").value;
    var Z = +document.getElementById("z").value;
    console.log(X, Y, Z);
    var [lat, lon, alt] = ECEFToLLA(X, Y, Z);
    console.log([lat, lon, alt]);

    document.getElementById("ECEFToLLA_RESULT").innerHTML = `[X = ${X}, Y = ${Y}, Z = ${Z}]<br/>[lat = ${lat}, lon = ${lon}, alt = ${alt}]`;

});


/***************** MAP With Current User IP Marker ************************************/
initMap = function () {


    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        maxZoom: 18,
        center: {lat: 50, lng: 9}
    });

    fetch('https://freegeoip.live/json/')
        .then(res => res.json())
        .then((out) => {
            console.log('Checkout this JSON! ', out);
            var ip = out.ip;
            var ipLatLng = {lat: out.latitude, lng: out.longitude};

            var ipMarker = new google.maps.Marker({
                position: ipLatLng,
                map: map,
                title: `User IP Location! :)<br/>IP: ${ip}<br/>{lat: ${ipLatLng.lat}, lng: ${ipLatLng.lng}}`
            });
            google.maps.event.addListener(ipMarker, 'click', function(evt) {
                var infoWin = new google.maps.InfoWindow();
                infoWin.setContent(ipMarker.getTitle());
                infoWin.open(map, ipMarker);
            });


            map.setCenter(ipMarker.getPosition());


        })
        .catch(err => { throw err });

};
initMap();


