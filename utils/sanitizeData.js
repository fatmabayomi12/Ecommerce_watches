export const sanitizeUser = (user) => {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
    };
};

export const sanitizeCategory = (category) => {
    return {
        _id: category._id,
        name: category.name,
    };
};

export const sanitizeSubCategory = (subCategory) => {
    return {
        _id: subCategory._id,
        name: subCategory.name,
        category: subCategory.category
    };
};

export const sanitizeBrand = (brand) => {
    return {
        _id: brand._id,
        name: brand.name,
        subCategory: brand.subCategory
    };
};

export const sanitizeReview = (review) => {
    return {
        _id: review._id,
        content: review.content,
        ratings: review.ratings,
        user: review.user,
        product: review.product
    };
};

export const sanitizeProduct = (product) => {
    return {
        _id: product._id,
        title: product.title,
        quantity: product.quantity,
        sold: product.sold,
        description: product.description,
        price: product.price,
        colors: product.colors,
        imageCover: product.imageCover,
        images: product.images,
        category: product.category,
        subcategories: product.subcategories,
        brand: product.brand,
        reviews: product.reviews,
        ratingsAverage: product.ratingsAverage,
        ratingsQuantity: product.ratingsQuantity
    };
};

export const sanitizeCoupon = (coupon) => {
    return {
        _id: coupon._id,
        name: coupon.name,
        expire: coupon.expire,
        discount: coupon.discount
    };
};

export const sanitizeCart = (cart) => {
    return {
        _id: cart._id,
        numOfCartItems: cart.numOfCartItems,
        user: cart.user,
        cartItems: cart.cartItems,
        totalCartPrice: cart.totalCartPrice,
        totalPriceAfterDiscount: cart.totalPriceAfterDiscount
    };
};

export const sanitizeOrder = (order) => {
    return {
        _id: order._id,
        user: order.user,
        cartItems: order.cartItems,
        shippingAddress: order.shippingAddress,
        shippingPrice: order.shippingPrice || 0,
        paymentMethodType: order.paymentMethodType,
        isPaid: order.isPaid || false,
        paidAt: order.paidAt || null,
        isDelivered: order.isDelivered || false,
        deliveredAt: order.deliveredAt || null,
        totalOrderPrice: order.totalOrderPrice || 0,
        totalPriceAfterDiscount: order.totalPriceAfterDiscount || order.totalOrderPrice,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
    };
};

