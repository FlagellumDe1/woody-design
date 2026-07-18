import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import MicroModal from 'micromodal'

MicroModal.init();
document.addEventListener('DOMContentLoaded', () => {
    new Swiper('.products-slider', {
        modules: [Navigation, Pagination, Autoplay],
        loop: true,
        slidesPerView: 3,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        breakpoints: {
            320: {
                slidesPerView: 1,
                spaceBetween: 20
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 24
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 24
            }
        }
    });

    void createGalleries();
});

// 1. Получаем ВСЕ изображения статическим glob из src/assets/galleries
const allImages = import.meta.glob('/src/assets/galleries/*/*.{jpg,jpeg,png,gif,webp}', {
    eager: false,
    import: 'default'
});

// 2. Функция для получения всех папок
function getGalleryFolders() {
    const folders = new Set();
    for (const path of Object.keys(allImages)) {
        const match = path.match(/\/assets\/galleries\/([^/]+)\//);
        if (match) {
            folders.add(match[1]);
        }
    }
    return Array.from(folders);
}

// 3. Функция для загрузки изображений из конкретной папки
async function loadGalleryImages(folderName) {
    const folderImages = {};
    for (const [path, importFn] of Object.entries(allImages)) {
        if (path.includes(`/assets/galleries/${folderName}/`)) {
            folderImages[path] = importFn;
        }
    }

    const items = await Promise.all(
      Object.entries(folderImages).map(async ([path, importFn]) => {
          const src = await importFn();
          const img = new Image();
          img.src = src;
          await img.decode();

          return {
              src,
              width: img.naturalWidth,
              height: img.naturalHeight,
              title: path.split('/').pop().replace(/\.[^/.]+$/, '')
          };
      })
    );

    return items;
}

// 4. Создаем галереи
async function createGalleries() {
    const folders = getGalleryFolders();

    if (!folders.length) {
        console.warn('Галереи не найдены. Проверьте путь import.meta.glob и наличие файлов в src/assets/galleries');
        return;
    }

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'gallery-buttons-container';
    buttonsContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        padding: 20px;
        justify-content: center;
    `;
    document.body.appendChild(buttonsContainer);

    for (const folder of folders) {
        const items = await loadGalleryImages(folder);

        const galleryContainer = document.createElement('div');
        galleryContainer.id = `gallery-${folder}`;
        galleryContainer.style.display = 'none';
        document.body.appendChild(galleryContainer);

        items.forEach((item, index) => {
            const link = document.createElement('a');
            link.href = item.src;
            link.dataset.pswpWidth = item.width;
            link.dataset.pswpHeight = item.height;
            link.dataset.index = index;
            galleryContainer.appendChild(link);
        });

        const lightbox = new PhotoSwipeLightbox({
            gallery: `#gallery-${folder}`,
            children: 'a',
            pswpModule: () => import('photoswipe')
        });
        lightbox.init();

        const button = document.querySelector(`#btn-gallery-${folder}`);
        if (!button) {
            console.warn(`Кнопка для галереи "${folder}" не найдена (ожидался селектор #btn-gallery-${folder})`);
            continue;
        }

        button.addEventListener('click', () => {
            lightbox.loadAndOpen(0, {
                gallery: document.querySelector(`#gallery-${folder}`)
            });
        });
    }
}