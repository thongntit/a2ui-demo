export const inventory = [
 {list_id:101,subject:'iPhone 14 Pro 128GB · tím',price:13900000,category:'phone',region_name:'Tp Hồ Chí Minh',area_name:'Quận 3',account_type:'p',contain_videos:true,emoji:'📱',color:'#ede8f6',description:'Pin 89%, máy nguyên bản, có hộp. Có thể xem máy trực tiếp.',seller:'Minh Anh'},
 {list_id:102,subject:'iPhone 13 128GB · xanh',price:8500000,category:'phone',region_name:'Tp Hồ Chí Minh',area_name:'Bình Thạnh',account_type:'c',contain_videos:false,emoji:'📱',color:'#e1edf3',description:'Ngoại hình đẹp, bảo hành cửa hàng 3 tháng.',seller:'Điện thoại Sài Gòn'},
 {list_id:103,subject:'iPhone 15 Pro 256GB',price:18900000,category:'phone',region_name:'Tp Hồ Chí Minh',area_name:'Quận 7',account_type:'p',contain_videos:true,emoji:'📱',color:'#e8e6e2',description:'Titan tự nhiên, pin 95%, còn bảo hành.',seller:'Hoàng'},
 {list_id:104,subject:'Samsung Galaxy S23 256GB',price:9200000,category:'phone',region_name:'Tp Hồ Chí Minh',area_name:'Thủ Đức',account_type:'p',contain_videos:false,emoji:'📱',color:'#e4efdf',description:'Máy dùng kỹ, màn hình không trầy.',seller:'Tuấn'},
 {list_id:201,subject:'Honda Vision 2022 · trắng',price:28500000,category:'motorbike',region_name:'Tp Hồ Chí Minh',area_name:'Quận 10',account_type:'p',contain_videos:true,emoji:'🛵',color:'#e5edf0',description:'Chính chủ, 12.000 km, giấy tờ đầy đủ.',seller:'Ngọc'},
 {list_id:202,subject:'Honda Air Blade 2020',price:32000000,category:'motorbike',region_name:'Tp Hồ Chí Minh',area_name:'Tân Bình',account_type:'c',contain_videos:true,emoji:'🛵',color:'#eee6dc',description:'Bảo dưỡng đầy đủ, hỗ trợ sang tên.',seller:'Xe máy Thành Đạt'},
 {list_id:203,subject:'Yamaha Janus 2021',price:21500000,category:'motorbike',region_name:'Tp Hồ Chí Minh',area_name:'Gò Vấp',account_type:'p',contain_videos:false,emoji:'🛵',color:'#f4e5e5',description:'Xe đi làm hằng ngày, tiết kiệm xăng.',seller:'Hà'},
 {list_id:301,subject:'MacBook Air M1 8GB / 256GB',price:11500000,category:'laptop',region_name:'Tp Hồ Chí Minh',area_name:'Quận 1',account_type:'p',contain_videos:true,emoji:'💻',color:'#e7e8ee',description:'Pin 92%, 160 chu kỳ, kèm sạc zin.',seller:'Khoa'},
 {list_id:302,subject:'ThinkPad T14 · RAM 16GB',price:7800000,category:'laptop',region_name:'Tp Hồ Chí Minh',area_name:'Phú Nhuận',account_type:'c',contain_videos:false,emoji:'💻',color:'#e3ebe7',description:'Ryzen 5, SSD 512GB, bảo hành 6 tháng.',seller:'Laptop Việt'},
 {list_id:303,subject:'Dell Latitude 5420 · i5',price:6500000,category:'laptop',region_name:'Tp Hồ Chí Minh',area_name:'Quận 5',account_type:'p',contain_videos:false,emoji:'💻',color:'#ede9e2',description:'RAM 16GB, SSD 256GB, phù hợp làm việc.',seller:'Linh'}
];
export const priceLabel = price => new Intl.NumberFormat('vi-VN').format(price) + ' đ';
export function search(query={}) {
 let ads=inventory.filter(a=>(!query.category||a.category===query.category)&&(!query.q||a.subject.toLowerCase().includes(query.q.toLowerCase()))&&(!query.maxPrice||a.price<=query.maxPrice)&&(!query.f||query.f.split(',').includes(a.account_type))&&(!query.contain_videos||a.contain_videos));
 if(query.sort==='price') ads.sort((a,b)=>a.price-b.price);
 return ads;
}
