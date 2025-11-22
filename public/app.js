document.addEventListener('DOMContentLoaded', () => {
    const groomBtn = document.getElementById('groomBtn');
    const exportBtn = document.getElementById('exportBtn');
    const backlogInput = document.getElementById('backlogInput');
    const resultsSection = document.getElementById('resultsSection');
    const cardsContainer = document.getElementById('cardsContainer');
    const btnText = groomBtn.querySelector('.btn-text');
    const loader = groomBtn.querySelector('.loader');

    let currentItems = [];

    groomBtn.addEventListener('click', async () => {
        const text = backlogInput.value.trim();

        if (!text) {
            alert('Please enter some backlog text first.');
            return;
        }

        // Loading state
        setLoading(true);
        resultsSection.classList.add('hidden');
        cardsContainer.innerHTML = '';
        currentItems = [];

        try {
            const response = await fetch('/api/groom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ backlogText: text })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to groom backlog');
            }

            currentItems = data.items;
            renderCards(currentItems);
            resultsSection.classList.remove('hidden');

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred: ' + error.message);
        } finally {
            setLoading(false);
        }
    });

    exportBtn.addEventListener('click', () => {
        if (!currentItems || currentItems.length === 0) return;

        const rows = currentItems.map(item => ({
            Title: item.Title,
            'User Story': item['User Story'],
            'Acceptance Criteria': item['Acceptance Criteria'].join('\n'),
            Priority: item.Priority,
            Tags: item.Tags ? item.Tags.join(', ') : ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Backlog");
        XLSX.writeFile(workbook, "groomed_backlog.xlsx");
    });

    function setLoading(isLoading) {
        groomBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            loader.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    }

    function renderCards(items) {
        if (!items || items.length === 0) {
            cardsContainer.innerHTML = '<p class="subtitle">No items found.</p>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';

            const priorityClass = getPriorityClass(item.Priority);

            const acceptanceCriteriaHtml = item['Acceptance Criteria']
                .map(criteria => `<li>${criteria}</li>`)
                .join('');

            const tagsHtml = item.Tags && item.Tags.length > 0
                ? `<div class="tags-container">
                    ${item.Tags.map(tag => `<span class="tag ${getTagClass(tag)}">${tag}</span>`).join('')}
                   </div>`
                : '';

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${item.Title}</h3>
                    <span class="priority-badge ${priorityClass}">${item.Priority}</span>
                </div>
                <div class="user-story">
                    ${item['User Story']}
                </div>
                ${tagsHtml}
                <div class="acceptance-criteria">
                    <h4>Acceptance Criteria</h4>
                    <ul>
                        ${acceptanceCriteriaHtml}
                    </ul>
                </div>
            `;

            cardsContainer.appendChild(card);
        });
    }

    function getPriorityClass(priority) {
        if (!priority) return 'priority-medium';
        const p = priority.toLowerCase();
        if (p.includes('high')) return 'priority-high';
        if (p.includes('low')) return 'priority-low';
        return 'priority-medium';
    }

    function getTagClass(tag) {
        const t = tag.toLowerCase();
        if (t.includes('bug')) return 'tag-bug';
        if (t.includes('feature')) return 'tag-feature';
        if (t.includes('ux')) return 'tag-ux';
        if (t.includes('security')) return 'tag-security';
        if (t.includes('infra')) return 'tag-infra';
        if (t.includes('performance')) return 'tag-performance';
        return 'tag-default';
    }
});
