//Weather definition
var Weather = function() {
}

Weather.prototype.setDate = function() {
    var d = new Date();
    var n = d.toDateString(); 
    $("#date").text(n);
};

Weather.prototype.getLocation = function() {
    var res = {
        "city": "Baku",
        "country": "Azerbaijan",
        "countryCode": "AZ",
        "query": "dummy-ip",
        "regionName": "Baku",
        "status": "success"
    };
    
    if (res.status === "success") {
        document.getElementById("location").value = res.city + ", " + res.countryCode;
        this.location = res.city + ", " + res.countryCode;
        this.currentWeather();
        this.forecast();
    }
};

Weather.prototype.setLocation = function() {
    $(document).on('keypress', '#location', (function(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            this.performSearch();
        }
    }).bind(this));
    
    $("#search-icon").on("click", (function(){
        this.performSearch();
    }).bind(this));
};

Weather.prototype.performSearch = function() {
    var location = $("#location").val().trim();
    if (location) {
        this.location = location;
        this.currentWeather();
        this.forecast();
        this.loadAnimation();
    }
};


Weather.prototype.updateLocalTime = function(timezoneOffset) {
    // Clear any existing interval
    if (this.timeInterval) {
        clearInterval(this.timeInterval);
    }
    // Update time immediately and then every second
    const updateTime = () => {
        const localTime = this.getLocalTime(timezoneOffset);
        $("#timeDisplay").text(localTime);
    };
    
    updateTime();
    this.timeInterval = setInterval(updateTime, 1000);
};

Weather.prototype.getLocalTime = function(timezoneOffset) {
    const now = new Date();
    const localTime = new Date(now.getTime() + (timezoneOffset * 1000));
    
    let hours = localTime.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const minutes = localTime.getMinutes().toString().padStart(2, '0');
   
    
    return `${hours}:${minutes} ${ampm}`;
};

Weather.prototype.currentWeather = function() {
    if (this.location) {
        $.getJSON("https://api.openweathermap.org/data/2.5/weather", {
            q: this.location, 
            units: "metric", 
            appid: "bc1301b0b23fe6ef52032a7e5bb70820"
        }, (function(json) {
            console.log("API Response:", json);
            
            // Update location display
            if (json.name && json.sys && json.sys.country) {
                $("#locationDisplay").text(json.name + ", " + json.sys.country);
            }
            
            // Update time display if timezone is available
            if (json.timezone) {
                this.updateLocalTime(json.timezone);
            }
            
            // Rest of your weather display code...
            var wId = json.weather[0].id;
            if(wId) {
                var icon = this.getWeatherIcon(wId, json.sys.sunrise, json.sys.sunset);
                this.displayWeatherIcon("#wicon-main", icon);
            }
            
            if (json.main) {
                $("#temperature").text(Math.round(json.main.temp) + "°");
                $("#description").text(json.weather[0].description);
                $("#humidity").text(json.main.humidity || "0");
            }
        }).bind(this)).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("API Error:", textStatus, errorThrown);
            alert("Location not found. Please try another city.");
        });
    }
};

/*
#timeDisplay {
    font-size: 1rem;
    font-weight: bold;
    color: #333;
    margin: 5px 0;
    text-align: center;
}
*/

Weather.prototype.getWeatherIcon = function(wId, sunrise, sunset) {
    if(wId) {
        var icon={};
        icon.name = "na";
        icon.animation = "wi-scale";

        function between(min, max, group, animation) {
            if (wId >= min && wId < max) {
                icon.name = group ? group : "na";
                icon.animation = animation ? animation : "wi-scale";
            }
        }

        between(200, 300, "thunderstorm", "wi-fade");
        between(300, 400, "showers", "wi-moveY");
        between(500, 600, "rain", "wi-moveY");
        between(600, 700, "snow", "wi-moveY");
        between(700, 800, "na", "wi-fade");
        between(801, 900, "cloudy", "wi-moveX");
        between(900, 1000, "na");

        var cond = {
                200: "storm-showers",
                201: "storm-showers",
                202: "thunderstorm",
                500: "rain-mix",
                501: "rain-mix",
                502: "rain",
                511: "sleet",
                520: "rain-mix",
                521: "rain-mix",
                600: "snow",
                611: "sleet",
                701: "fog",
                741: "fog",
                905: "windy",
                906: "hail",
            };

        var neutralCond = {
            711: "smoke",
            731: "sandstorm",
            761: "dust",
            762: "volcano",
            781: "tornado",
            900: "tornado",
            902: "hurricane",
            903: "snowflake-cold",
            904: "hot",
            958: "gale-warning",
            959: "gale-warning",
            960: "storm-warning",
            961: "storm-warning",
            962: "hurricane"
        };
        var dayCond = {
            721: "haze",
            800: "sunny"
        };
        var nightCond = {
            800: "clear",
            701: "fog",
            741: "fog"
        };
        
        icon.name = cond[wId] ? cond[wId] : icon.name;
        icon.name = neutralCond[wId] ? neutralCond[wId] : icon.name;
        icon.name = dayCond[wId] ? dayCond[wId] : icon.name;
        var time = "day";
        if (sunrise && sunset) {
            var now = Date.now()/1000;
            var srDate = new Date(sunrise*1000);
            if (srDate.getDate() == new Date().getDate()) {
                if (now <= sunrise && now >= sunset) {
                    time = nightCond[wId] ? "night" : "night-alt";
                    icon.name = nightCond[wId] ? nightCond[wId] : icon.name;
                }
            } else {
                time = nightCond[wId] ? "night" : "night-alt";
                icon.name = nightCond[wId] ? nightCond[wId] : icon.name;
            }
        }
        if (icon.name != "na" && !neutralCond[wId]) {
            icon.name = "wi-"+time+"-"+icon.name;
        } else {
            icon.name = "wi-"+icon.name;
        }
        icon.animation = icon.name == "wi-day-sunny" ? "wi-rotate" : icon.animation;
        return icon;
    }
}; //end getWeatherIcon

Weather.prototype.displayWeatherIcon = function(selector, icon) {
    if (selector && typeof icon == "object" && icon.name != "na") {
        $(selector).removeClass(function(index, className) {
            return (className.match(/\bwi-\S+/g) || []).join(' ');
        });
        
        if (!$(selector).hasClass('wi')) {
            $(selector).addClass('wi');
        }
        
        $(selector).addClass(icon.name);
        
        if (icon.animation) {
            animate(selector, icon.animation, 2000, 0, "linear", "infinite");
        }
    }
};




Weather.prototype.forecast = function() {
    function setForecast(res) {
        this.daily=[];
        var list = res.list;
        for (var i = 0, len = list.length; i < len; i++) {
            this.daily[i] = this.daily[i] ? this.daily[i] : {};
            this.daily[i].maxTemp = Math.round(list[i].temp.max);
            this.daily[i].minTemp = Math.round(list[i].temp.min);
            this.daily[i].day = new Date(list[i].dt*1000).getDay();
            var iconId = list[i].weather[0].id;
            this.daily[i].icon = this.getWeatherIcon(iconId);
        }
    }
    function displayForecast() {
        var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
        _this = this;
        $(".days-box").children(".section").each(function(index) {
            $(this).children('.day').text(days[_this.daily[index].day]);
            $(this).find('.d-min-temp').text(_this.daily[index].minTemp+"°");
            $(this).find('.d-max-temp').text(_this.daily[index].maxTemp+"°");
            $(this).find('.wi').addClass(_this.daily[index].icon.name);
        });
    }

    $.getJSON("https://api.openweathermap.org/data/2.5/forecast/daily",{q: this.location, cnt: 4, units: "metric", appid: "bc1301b0b23fe6ef52032a7e5bb70820"}, (function(json) {
            setForecast.call(this,json);
            displayForecast.call(this);
    }).bind(this) );
};

Weather.prototype.setUnit = function() {
    var currentUnit = "C";
    
    $("#unit-switch").prop("checked", false);
    
    $(".toggle-text.left").addClass("active");
    $(".toggle-text.right").removeClass("active");

    $("#unit-switch").on("change", function() {
        currentUnit = $(this).is(":checked") ? "F" : "C";
        
        $(".d-min-temp, .d-max-temp, #temperature").each(function() {
            var tempText = $(this).text().replace("°", "");
            var tempValue = parseFloat(tempText);
            
            if (!isNaN(tempValue)) {
                var convertedTemp;
                if (currentUnit === "F") {
                    convertedTemp = Math.round((tempValue * 1.8) + 32);
                    $(".toggle-text.left").removeClass("active");
                    $(".toggle-text.right").addClass("active");
                } else {
                    convertedTemp = Math.round((tempValue - 32) / 1.8);
                    $(".toggle-text.left").addClass("active");
                    $(".toggle-text.right").removeClass("active");
                }
                $(this).text(convertedTemp + "°");
            }
        });
    });
};

Weather.prototype.loadAnimation = function() {
$(".loading").css("display","block");
    var countAjax = 0;
    $(document).ajaxComplete(function() {
        countAjax++;
        if(countAjax == 2){
            $(".loading").fadeOut();
            loadTooltips();
            animate(".days-box", "scale", 400, 500, "ease-out");
            var delayAnim = 1300;
            $(".days-box").children(".col-xs-3").each(function() {
                animate(this, "fadeIn", 350, delayAnim, "ease-out");
                delayAnim += 350;
            });
        }
    });
}

function animate (selector, keyFrameName, duration, delay=0, timing="ease", iteration=1) {
    //jQuery selector; CSS keyframes name; duration in ms; delay in ms;
    setTimeout(
        function () {
            $(selector).css({"visibility": "visible"});
            $(selector).css({"animation": keyFrameName+" "+duration+"ms "+timing+" "+iteration});
        }, delay
    );
    if (iteration != "infinite") {
        setTimeout(
            function () {
                $(selector).css({"animation": ""});
            }, (delay+duration)*iteration
        );
    }
};
function loadTooltips() {
    $("[data-tooltip]").each(function() {
        var tag = $(this)[0].tagName.toLowerCase();
        var tooltip = $(this).attr("data-tooltip");
        var tooltipParentH = $(this).outerHeight();
        var parentPosition = $(this).position();
        $(tooltip).insertAfter(this);
        $(tooltip).css({"max-width": document.body.clientWidth-parentPosition.left-5+"px", "transition": "opacity 0.3s"});
        
        function showTooltip() {
            $(tooltip).css({"visibility": "visible", "opacity": 1, "top": parentPosition.top+tooltipParentH+10+"px", "left": parentPosition.left+"px"});
        }
        function hideTooltip() {
            $(tooltip).on("mouseenter", stopTimerHide);
            function stopTimerHide() {
                clearTimeout(timerHide);
                $(tooltip).on("mouseleave", hideTooltip);
            }
            var timerHide = setTimeout(function(){
                $(tooltip).css({"visibility": "hidden", "opacity": 0});
            }, 100);
        }
        
        var _this = $(this);
        if (tag == "input") {
            $(this).on("focus", function() {
                showTooltip();
                _this.off("mouseleave", hideTooltip);
            });
            $(this).on("blur", function() {
                hideTooltip();
                _this.on("mouseleave", hideTooltip);
            });
            $(this).on("mouseenter", showTooltip);
            $(this).on("mouseleave", hideTooltip);
        } else {
            $(this).on("mouseenter", showTooltip);
            $(this).on("mouseleave", hideTooltip);
        }
    });
}

//Run
$(document).ready(function () {
    var weather = new Weather();
    $("#unit-switch").prop("checked", true);
    weather.loadAnimation();
    weather.setDate();
    weather.getLocation();
    weather.setLocation();
    weather.setUnit();
});
