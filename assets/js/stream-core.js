// ===============================
// V30 STREAM CORE
// Canlı Yayın kanal yönetimi ve 1/2/4/6 ekran matrix fonksiyonları.
// Bu dosya V30 modülerleştirme adımıdır; davranış değiştirmez.
// ===============================

function omega_OpenChannelManager() {
            document.getElementById('channel-manager-overlay').style.display = 'flex';
            setTimeout(() => { document.getElementById('channel-manager-overlay').classList.add('show-modal'); }, 10);
            omega_RenderChannelTable();
        }

        function omega_CloseChannelManager() {
            document.getElementById('channel-manager-overlay').classList.remove('show-modal');
            setTimeout(() => { document.getElementById('channel-manager-overlay').style.display = 'none'; }, 300);
        }

        function omega_AddCustomChannel() {
            const chName = document.getElementById('new-ch-name').value;
            const chUrl = document.getElementById('new-ch-url').value;
            if(!chName || !chUrl) return;
            _CHANNELS_DB.push({ id: Date.now(), name: chName, url: chUrl });
            localStorage.setItem('v19_channels', JSON.stringify(_CHANNELS_DB));
            document.getElementById('new-ch-name').value = "";
            document.getElementById('new-ch-url').value = "";
            omega_RenderChannelTable();
            omega_UpdateMatrixDropdowns();
        }

        function omega_DeleteCustomChannel(index) {
            _CHANNELS_DB.splice(index, 1);
            localStorage.setItem('v19_channels', JSON.stringify(_CHANNELS_DB));
            omega_RenderChannelTable();
            omega_UpdateMatrixDropdowns();
        }

        function omega_RenderChannelTable() {
            const tbody = document.getElementById('channel-table-body');
            let rowsHtml = "";
            if(_CHANNELS_DB.length === 0) {
                rowsHtml = `<tr><td colspan="3" style="text-align:center; padding:30px; color:var(--muted); font-weight:700;">Sistemde kayıtlı kanal bulunamadı.</td></tr>`;
            } else {
                _CHANNELS_DB.forEach((ch, index) => {
                    rowsHtml += `
                        <tr>
                            <td style="font-weight:900; color:var(--gold); padding:12px;">${ch.name}</td>
                            <td style="font-family:'JetBrains Mono'; font-size:0.85em; color:var(--muted); word-break:break-all; padding:12px;">${ch.url}</td>
                            <td style="text-align:right; padding:12px;">
                                <button onclick="omega_DeleteCustomChannel(${index})" style="background:var(--red); border:none; padding:6px 15px; border-radius:6px; color:#fff; cursor:pointer; font-weight:bold;">SİL</button>
                            </td>
                        </tr>`;
                });
            }
            tbody.innerHTML = rowsHtml;
        }

        function omega_UpdateMatrixDropdowns() {
            let optionsHtml = `<option value="">KANAL SEÇ...</option>`;
            _CHANNELS_DB.forEach(ch => {
                optionsHtml += `<option value="${ch.url}">${ch.name}</option>`;
            });
            document.querySelectorAll('.matrix-channel-select').forEach(selectElem => {
                const prevVal = selectElem.value;
                selectElem.innerHTML = optionsHtml;
                selectElem.value = prevVal;
            });
        }

        function omega_FullscreenIframe(id) {
            const iframe = document.getElementById('s-fr-' + id);
            if (!iframe) return;
            if (iframe.requestFullscreen) iframe.requestFullscreen();
            else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
            else if (iframe.msRequestFullscreen) iframe.msRequestFullscreen();
        }

        function omega_BuildStreamMatrix(numScreens) {
            numScreens = Number(numScreens || 6);

            const scrollY = window.scrollY || window.pageYOffset || 0;

            _ACTIVE_LAYOUT = numScreens;
            localStorage.setItem('v19_layout', numScreens);

            const gridContainer = document.getElementById('omega-matrix-grid');
            if (!gridContainer) return;

            gridContainer.className = `stream-master-grid active m-lay-${numScreens}`;

            document.querySelectorAll('.btn-stream-layout').forEach(b => b.classList.remove('active'));
            const clickedBtn = document.getElementById('lay-btn-' + numScreens);
            if(clickedBtn) clickedBtn.classList.add('active');

            let optionsHtml = `<option value="">KANAL SEÇ...</option>`;
            _CHANNELS_DB.forEach(ch => {
                optionsHtml += `<option value="${ch.url}">${ch.name}</option>`;
            });

            const blocks = [];
            for(let i=1; i<=numScreens; i++) {
                let savedUrl = _ACTIVE_STREAMS[i-1] || "";
                blocks.push(`
                    <div class="matrix-unit">
                        <div class="matrix-nav">
                            <select id="s-sel-${i}" class="matrix-channel-select select-supreme" style="padding:6px; min-width:120px; font-size:11px" onchange="omega_LoadChannelToInput(${i})">
                                ${optionsHtml}
                            </select>
                            <input id="s-in-${i}" value="${savedUrl}" style="flex:1; background:#000; border:1px solid #333; color:#fff; padding:8px; border-radius:4px; font-size:11px;" placeholder="Yayın URL...">
                            <button onclick="omega_LaunchStreamUnit(${i})" style="background:var(--green); border:none; padding:0 12px; border-radius:4px; font-weight:800; cursor:pointer;">İZLE</button>
                            <button onclick="omega_FullscreenIframe(${i})" style="background:#272727; color:var(--blue-accent); border:none; padding:0 12px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-expand"></i></button>
                            <button onclick="omega_TerminateStreamUnit(${i})" style="background:var(--red); color:#fff; border:none; padding:0 12px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <iframe id="s-fr-${i}" style="flex:1; border:none; background:#000000;" src="${savedUrl || 'about:blank'}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-read; clipboard-write; web-share" allowfullscreen></iframe>
                    </div>`);
            }

            gridContainer.innerHTML = blocks.join('');
            window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
        }

        function omega_LoadChannelToInput(id) {
            const selectElem = document.getElementById('s-sel-' + id);
            const inputElem = document.getElementById('s-in-' + id);
            if(selectElem.value) {
                inputElem.value = selectElem.value;
                omega_LaunchStreamUnit(id);
            }
        }

        function omega_LaunchStreamUnit(id) {
            let url = document.getElementById('s-in-' + id).value;
            if(url) {
                const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
                if (ytMatch && ytMatch[1]) {
                    url = "https://www.youtube.com/embed/" + ytMatch[1] + "?autoplay=1";
                    document.getElementById('s-in-' + id).value = url;
                }
                document.getElementById('s-fr-' + id).src = url;
                _ACTIVE_STREAMS[id-1] = url;
                localStorage.setItem('v19_streams', JSON.stringify(_ACTIVE_STREAMS));
            }
        }

        function omega_TerminateStreamUnit(id) {
            document.getElementById('s-sel-' + id).value = "";
            document.getElementById('s-in-' + id).value = "";
            document.getElementById('s-fr-' + id).src = "about:blank";
            _ACTIVE_STREAMS[id-1] = "";
            localStorage.setItem('v19_streams', JSON.stringify(_ACTIVE_STREAMS));
        }
