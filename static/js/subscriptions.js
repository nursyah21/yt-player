/* Subscription Management */
async function loadSubscriptions() {
    const data = await Helper.fetchJSON('/list_subscriptions', { hideProgress: true });
    const $list = $('#subscriptionList');
    $list.empty();

    // Reset global registry
    window.subscribedChannels = {};

    if (data?.results?.length) {
        data.results.sort((a, b) => a.uploader.localeCompare(b.uploader));
        data.results.forEach(sub => {
            // Populate global registry for menu state checks
            if (sub.channel_id) window.subscribedChannels[sub.channel_id] = true;
            window.subscribedChannels[sub.uploader] = true;

            const hasThumb = sub.thumbnail && !sub.thumbnail.includes('sample_avatar.png') && !sub.thumbnail.includes('gstatic.com');
            const thumbHtml = hasThumb ? `<img src="${sub.thumbnail}">` : '';
            const link = `/?page=home&q=${sub.channel_id ? encodeURIComponent('https://www.youtube.com/channel/' + sub.channel_id + '/videos') : encodeURIComponent('"' + sub.uploader + '"')}&uploader=${encodeURIComponent(sub.uploader)}`;

            $list.append(`
                <a href="${link}" class="subscription-item" onclick="event.preventDefault(); searchChannel(event, '${sub.channel_id || ''}', '${sub.uploader.replace(/'/g, "\\'")}')">
                    ${thumbHtml}
                    <span class="truncate" style="min-width: 0; flex: 1;">${sub.uploader}</span>
                </a>
            `);
        });
    } else {
        $list.html('<div class="text-[11px] text-gray-600 px-4 py-2">Belum ada subscription</div>');
    }
}

async function toggleSubscription(channelId, uploader, thumbnail) {
    const data = await Helper.post('/toggle_subscription', {
        channel_id: channelId,
        uploader: uploader,
        thumbnail: thumbnail
    });

    if (data?.status === 'success') {
        const isSubbed = data.is_subscribed;
        await loadSubscriptions();

        const newText = isSubbed ? 'Unsubscribe' : 'Subscribe';

        // Update Player specific elements
        const $text = $('#playerSubscribeText');
        if ($text.length) {
            $text.text(newText);
            $('#playerSubscribeMenu').removeClass('opacity-50');
        }

        // Update all related menu items across the UI robustly
        $('.sub-menu-item').each(function () {
            const $item = $(this);
            const itemCid = $item.attr('data-channel-id');
            const itemUp = $item.attr('data-uploader');

            if ((channelId && itemCid === channelId) || (uploader && itemUp === uploader)) {
                $item.find('span').text(newText);
            }
        });
    }
}

// Global registry
window.subscribedChannels = {};
