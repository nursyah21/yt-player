/* Subscription Management */
async function loadSubscriptions() {
    const data = await Helper.fetchJSON('/list_subscriptions', { hideProgress: true });
    const $list = $('#subscriptionList');
    $list.empty();

    if (data?.results?.length) {
        data.results.sort((a, b) => a.uploader.localeCompare(b.uploader));
        data.results.forEach(sub => {
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
        loadSubscriptions();
        const $btn = $('#subscribeBtn');
        if ($btn.length) {
            if (isSubbed) {
                $btn.removeClass('text-[#cc0000] hover:text-red-500').addClass('text-gray-500').text('SUBSCRIBED');
            } else {
                $btn.removeClass('text-gray-500').addClass('text-[#cc0000] hover:text-red-500').text('SUBSCRIBE');
            }
        }
    }
}
