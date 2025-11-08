// Updated bulk price calculation logic
export const getApplicableBulkPrice = (variant, quantity) => {
    if (!variant?.bulk_prices?.length) return null;

    // Sort bulk prices by max_quantity in descending order
    const sortedBulkPrices = [...variant.bulk_prices].sort((a, b) => b.max_quantity - a.max_quantity);

    // Find the first bulk price where quantity >= max_quantity
    return sortedBulkPrices.find(bulk => quantity >= bulk.max_quantity);
};

export const calculateItemPrice = (item) => {
    const bulkPrice = getApplicableBulkPrice(item.variant, item.quantity);

    // If bulk price is available, use it directly (all-inclusive price)
    if (bulkPrice) {
        return Number(bulkPrice.final_price);
    }

    // Otherwise, calculate price from product_variant_prices
    if (item.variant?.product_variant_prices?.[0]) {
        const variantPrice = item.variant.product_variant_prices[0];
        const basePrice = Number(variantPrice.actual_price);
        const discountAmount = basePrice * (variantPrice.discount / 100);
        return basePrice - discountAmount;
    }

    // Fallback to item price
    return item.actual_price || 0;
};

export const calculateGSTForItem = (item) => {
    const bulkPrice = getApplicableBulkPrice(item.variant, item.quantity);

    // If bulk price is applied, calculate GST from bulk price
    if (bulkPrice) {
        const itemTotal = Number(bulkPrice.final_price) * item.quantity;
        const gstAmount = (itemTotal * Number(bulkPrice.gst_percentage)) / 100;
        return gstAmount;
    }

    // Regular GST calculation for non-bulk items
    if (item.variant?.product_variant_prices?.[0]) {
        const variantPrice = item.variant.product_variant_prices[0];
        const basePrice = Number(variantPrice.actual_price);
        const discountAmount = basePrice * (variantPrice.discount / 100);
        const priceAfterDiscount = basePrice - discountAmount;
        const itemTotal = priceAfterDiscount * item.quantity;

        if (variantPrice.gst_tax) {
            return Number(variantPrice.gst_tax) * item.quantity;
        } else if (variantPrice.gst_percentage) {
            return (itemTotal * Number(variantPrice.gst_percentage)) / 100;
        }
    }

    return 0;
};

export const calculateDiscountForItem = (item) => {
    const bulkPrice = getApplicableBulkPrice(item.variant, item.quantity);

    // If bulk price is applied, calculate discount from bulk price
    if (bulkPrice) {
        const regularPrice = getBasePrice(item);
        const bulkPriceValue = Number(bulkPrice.final_price);
        const discountAmount = (regularPrice - bulkPriceValue) * item.quantity;
        return Math.max(0, discountAmount);
    }

    // Regular discount calculation
    if (item.variant?.product_variant_prices?.[0]) {
        const variantPrice = item.variant.product_variant_prices[0];
        const basePrice = Number(variantPrice.actual_price);
        const discountAmount = basePrice * (variantPrice.discount / 100);
        return discountAmount * item.quantity;
    }

    return 0;
};

export const getBasePrice = (item) => {
    // Get base price from product_variant_prices
    if (item.variant?.product_variant_prices?.[0]) {
        const variantPrice = item.variant.product_variant_prices[0];
        const basePrice = Number(variantPrice.actual_price);
        return basePrice;
    }
    return item.price || 0;
};

export const getVariantPriceInfo = (variants, quantity = 1) => {
    if (!variants || variants.length === 0) return {
        basePrice: 0,
        discount: 0,
        gstPercentage: 0,
        finalPrice: 0,
        variantPrice: null,
        bulkPrice: null,
        priceAfterDiscount: 0,
        gstAmount: 0,
        totalPrice: 0
    };

    const defaultVariant = variants.find(variant => variant.is_default) || variants[0];
    const variantPrice = defaultVariant?.product_variant_prices?.[0];

    if (!variantPrice) {
        return {
            basePrice: 0,
            discount: 0,
            gstPercentage: 0,
            finalPrice: 0,
            variantPrice: null,
            bulkPrice: null,
            priceAfterDiscount: 0,
            gstAmount: 0,
            totalPrice: 0
        };
    }

    // Check for bulk pricing
    const bulkPrice = getApplicableBulkPrice(defaultVariant, quantity);

    let finalPrice, gstAmount, priceAfterDiscount, totalPrice;

    if (bulkPrice) {
        // Bulk pricing - all inclusive
        finalPrice = Number(bulkPrice.final_price);
        priceAfterDiscount = finalPrice;
        gstAmount = (finalPrice * quantity * Number(bulkPrice.gst_percentage)) / 100;
        totalPrice = (finalPrice * quantity) + gstAmount;
    } else {
        // Regular pricing
        const basePrice = Number(variantPrice.actual_price);
        const discountAmount = basePrice * (variantPrice.discount / 100);
        priceAfterDiscount = basePrice - discountAmount;

        if (variantPrice.gst_tax) {
            gstAmount = Number(variantPrice.gst_tax) * quantity;
        } else if (variantPrice.gst_percentage) {
            gstAmount = (priceAfterDiscount * quantity * Number(variantPrice.gst_percentage)) / 100;
        } else {
            gstAmount = 0;
        }

        finalPrice = priceAfterDiscount;
        totalPrice = (priceAfterDiscount * quantity) + gstAmount;
    }

    return {
        basePrice: Number(variantPrice.actual_price),
        discount: variantPrice.discount || 0,
        gstPercentage: bulkPrice ? bulkPrice.gst_percentage : variantPrice.gst_percentage || 0,
        finalPrice: finalPrice,
        variantPrice: variantPrice,
        bulkPrice: bulkPrice,
        priceAfterDiscount: priceAfterDiscount,
        gstAmount: gstAmount,
        totalPrice: totalPrice
    };
};