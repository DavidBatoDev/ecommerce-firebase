// controllers/ordersController.js
import { query } from "../services/dbService.js";

// Place a new order
export const placeOrder = async (req, res, next) => {
    const userId = req.user.id;
    const { address, paymentMethod, paypalDetails, products } = req.body;

    // Validate required fields
    if (!address || !paymentMethod || !products || products.length === 0) {
        return res.status(400).json({ message: 'Missing required information' });
    }

    try {
        // Calculate the total amount
        const totalAmount = products.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Insert into orders table
        const result = await query(
            `INSERT INTO orders (user_id, total_amount, payment_method, paypal_email, delivery_email, delivery_street, delivery_city, delivery_state)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                totalAmount,
                paymentMethod,
                paymentMethod === 'paypal' ? paypalDetails.paypalEmail : null,
                address.email,
                address.street,
                address.city,
                address.state
            ]
        );

        const orderId = result.insertId;

        // Insert each product into order_items table
        for (const item of products) {
            await query(
                `INSERT INTO order_items (order_id, product_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [orderId, item.id, item.quantity, item.price]
            );
        }

        // Optionally: Clear the user's cart after placing the order
        await query(
            `DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = ?)`,
            [userId]
        );

        return res.status(201).json({ message: 'Order placed successfully', orderId });
    } catch (err) {
        console.error('Error placing order:', err);
        next(err);
    }
};

// Get order details by ID with product information
export const getOrderDetails = async (req, res, next) => {
    const orderId = req.params.orderId;

    try {
        // Fetch order details
        const order = await query(`SELECT * FROM orders WHERE id = ?`, [orderId]);

        if (order.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Fetch order items along with product details
        const orderItems = await query(`
            SELECT 
                oi.*, 
                p.name AS product_name, 
                p.image AS product_image, 
                p.description AS product_description 
            FROM 
                order_items oi 
            INNER JOIN 
                products p 
            ON 
                oi.product_id = p.id 
            WHERE 
                oi.order_id = ?`, [orderId]
        );

        // Map the order items to include product details
        const items = orderItems.map(item => ({
            id: item.id,
            product_id: item.product_id,
            name: item.product_name,
            image: item.product_image,
            description: item.product_description,
            quantity: item.quantity,
            price: item.price
        }));

        // Return order details with associated items
        return res.status(200).json({
            order: {
                ...order[0],
                items,
            },
        });
    } catch (err) {
        console.error('Error fetching order details:', err);
        next(err);
    }
};

// for getting all the orders, also get the order items and product details
export const getAllOrders = async (req, res, next) => {
    try {
        // Fetch all orders for the logged-in user
        const orders = await query(`SELECT * FROM orders WHERE user_id = ?`, [req.user.id]);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders found' });
        }

        // Fetch order items and product details for each order
        for (const order of orders) {
            const orderItems = await query(`
                SELECT 
                    oi.*, 
                    p.name AS product_name, 
                    p.image AS product_image, 
                    p.description AS product_description 
                FROM 
                    order_items oi 
                INNER JOIN 
                    products p 
                ON 
                    oi.product_id = p.id 
                WHERE 
                    oi.order_id = ?`, [order.id]
            );

            // Add product details to each order item
            order.items = orderItems.map(item => ({
                id: item.id,
                product_id: item.product_id,
                name: item.product_name,
                image: item.product_image,
                description: item.product_description,
                quantity: item.quantity,
                price: item.price
            }));
        }

        return res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        next(err);
    }
};