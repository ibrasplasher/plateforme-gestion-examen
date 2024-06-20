package com.example.todoapp;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

public class CustomSpinnerAdapter extends BaseAdapter {
    private Context context;
    private String[] statuses;
    private int[] icons;

    public CustomSpinnerAdapter(Context context, String[] statuses, int[] icons) {
        this.context = context;
        this.statuses = statuses;
        this.icons = icons;
    }

    @Override
    public int getCount() {
        return statuses.length;
    }

    @Override
    public Object getItem(int position) {
        return statuses[position];
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        if (convertView == null) {
            convertView = LayoutInflater.from(context).inflate(R.layout.spinner_item, parent, false);
        }

        ImageView icon = convertView.findViewById(R.id.status_icon);
        TextView status = convertView.findViewById(R.id.status);

        icon.setImageResource(icons[position]);
        status.setText(statuses[position]);
        setColorByStatus(status, statuses[position]);

        return convertView;
    }

    @Override
    public View getDropDownView(int position, View convertView, ViewGroup parent) {
        if (convertView == null) {
            convertView = LayoutInflater.from(context).inflate(R.layout.spinner_dropdown_item, parent, false);
        }

        ImageView icon = convertView.findViewById(R.id.status_icon);
        TextView status = convertView.findViewById(R.id.status);

        icon.setImageResource(icons[position]);
        status.setText(statuses[position]);
        setColorByStatus(status, statuses[position]);

        return convertView;
    }

    // Add this method to find the position of a status
    public int getPosition(String status) {
        for (int i = 0; i < statuses.length; i++) {
            if (statuses[i].equals(status)) {
                return i;
            }
        }
        return -1; // Return -1 if not found
    }

    // Method to set color by status
    private void setColorByStatus(TextView statusTextView, String status) {
        int colorId;
        switch (status) {
            case "Todo":
                colorId = R.color.todoColor;
                break;
            case "In progress":
                colorId = R.color.inProgressColor;
                break;
            case "Done":
                colorId = R.color.doneColor;
                break;
            case "Bug":
                colorId = R.color.bugColor;
                break;
            default:
                colorId = android.R.color.darker_gray; // Default color for "Status"
                break;
        }
        statusTextView.setTextColor(ContextCompat.getColor(context, colorId));
    }
}
