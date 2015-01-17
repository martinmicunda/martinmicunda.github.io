var ios = false;
ios = ( $('html').hasClass('appleios') );

$(document).ready(function() {

	var $window = $(window);
	$('.block').css({'background-attachment':'fixed'});
	
	$window.resize(function() {
		$('.block').height($window.height());
		var blocks = $('.block');
		$.each(blocks, function(i, block) {
			$('.up', $(block)).height($(block).height());
			$('.down', $(block)).height($(block).height());
			$('.copy', $(block)).css({
				'paddingTop': $(block).height() - 170
			});
			$('.up', $(block)).css({
				'backgroundPosition': newUpPos(block)
			});
			$(block).css({
				'backgroundPosition': newBackgroundPos(block)
			});
		});
	});
	
	function scrollHeader(scroll_to) {
		var should_scroll_header = false;
		var window_scroll_pos = $window.scrollTop();
		var scrolling_amount = scroll_to - window_scroll_pos;
		var scrolling_direction = "none";
		if (scrolling_amount < 0) {
			scrolling_direction = "up";
		} else if (scrolling_amount > 0) {
			scrolling_direction = "down";
		} else {
			scrolling_direction = "none";
		}
		if(ios){
			scrolling_direction = "none";
		}
		switch (scrolling_direction) {
		case "up":
			should_scroll_header = false;
			break;
		case "down":
			should_scroll_header = true;
			break;
		case "none":
			should_scroll_header = false;
			break;
		default:
			should_scroll_header = false;
			break;
		}
		if (should_scroll_header) {
			$('#top').css({
				'position': 'absolute'
			});
			$('#top').css({
				'top': $window.scrollTop()
			});
		} else {
			$('#top').css({
				'position': 'fixed'
			});
			$('#top').css({
				'top': 0
			});
		}
		return should_scroll_header;
	}

	function newBackgroundPos(inview) {
		var window_scroll_pos = $window.scrollTop();
		var bottom_pos = $(inview).offset().top;
		var pos = 50;
		if (bottom_pos && window_scroll_pos) {
			pos = 50 * (window_scroll_pos / bottom_pos);
		} else {
			pos = 50 * ((window_scroll_pos + 1080) / 1080);
		}
		var css = "50% " + pos + "%";
		return css;
	}
	function newUpPos(inview) {
		var window_scroll_pos = $(window).scrollTop();
		var top_pos = $(inview).offset().top;
		var intertia = 5;
		var pos = 50;
		if (top_pos && window_scroll_pos) {
			pos = (50 * (Math.pow((((window_scroll_pos - top_pos) / $(inview).height()) + 1) * 0.5, intertia) / Math.pow(0.5, intertia)));
		}
		if (pos < 45) {
			pos = 45;
		}
		var css = "50% " + pos + "%";
		return css;
	}
	
	$('#anchors li a, .contact-text2 a').click(function(e) {
		e.preventDefault();
		var block = $(this).attr('href');
		var scroll_to = $(block).offset().top;
		var should_scroll_header = scrollHeader(scroll_to);
		var top_height = $('#top').height();
		var top_top = $('#top').css('top');
		$('html, body').stop().animate({
			scrollTop: scroll_to
		}, 2100, 'easeInOutExpo', function() {
			if (should_scroll_header && (top_top != $window.scrollTop() + "px")) {
				$('#top').css({
					'top': $window.scrollTop() - top_height
				});
				$('#top').stop().animate({
					'top': $(window).scrollTop()
				}, 1000, 'easeInOutExpo', function() {
					$('#top').css({
						'position': 'fixed'
					});
					$('#top').css({
						'top': 0
					});
				});
			}
		});
	});

	
	if(!ios){
        $('.block').bind('inview', function(event, visible) {
            var id = $(this).attr('id');
            var anchor = "#" + id + "_btn";

            if (visible === true) {
                $(this).addClass("inview");
                $(anchor).addClass("inview");
            } else {
                $(this).removeClass("inview");
                $(anchor).removeClass("inview");
            }
        });

        $window.scroll(function() {
            $('#top').mouseleave();
            var inviews = $('.block.inview');
            $.each(inviews, function(i, inview) {
                var up = $('.up', inview);
                var copy = $('.copy', inview);
                var a = $('.copy a', inview);
                $(up).css({
                    'backgroundPosition': newUpPos(inview)
                });
                $(inview).css({
                    'backgroundPosition': newBackgroundPos(inview)
                });
            });
        });

        $window.resize();
	}
	
});